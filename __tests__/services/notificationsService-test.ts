import { getTriggerTime, getVibrationChannelId, scheduleNotificationsService, sweepStaleDisplayedNotifications } from '@/services/notificationsService';
import notifee from 'react-native-notify-kit';

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  init: jest.fn(),
}));

jest.mock('@/services/soundService', () => ({
  startSound: jest.fn(),
  stopSound: jest.fn(),
}));

jest.mock('react-native-notify-kit', () => ({
  __esModule: true,
  default: {
    getTriggerNotifications: jest.fn(() => Promise.resolve([])),
    cancelTriggerNotification: jest.fn(() => Promise.resolve()),
    getNotificationSettings: jest.fn(() => Promise.resolve({ android: { alarm: 'enabled' } })),
    createTriggerNotification: jest.fn(() => Promise.resolve()),
    getDisplayedNotifications: jest.fn(() => Promise.resolve([])),
    cancelDisplayedNotification: jest.fn(() => Promise.resolve()),
  },
  AndroidCategory: {},
  AndroidColor: { GREEN: 'green' },
  AndroidImportance: {},
  AndroidStyle: { INBOX: 'inbox' },
  AndroidVisibility: {},
  AndroidNotificationSetting: { ENABLED: 'enabled' },
  AuthorizationStatus: {},
  EventType: {},
  RepeatFrequency: { WEEKLY: 'weekly' },
  TriggerType: { TIMESTAMP: 'timestamp' },
}));

const mockCreateTrigger = notifee.createTriggerNotification as jest.Mock;
const mockGetDisplayed = notifee.getDisplayedNotifications as jest.Mock;
const mockCancelDisplayed = notifee.cancelDisplayedNotification as jest.Mock;

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('getTriggerTime', () => {
  // System time fixed at 2026-05-22 12:00:00 local
  const NOW = new Date(2026, 4, 22, 12, 0, 0);

  beforeEach(() => {
    jest.setSystemTime(NOW);
  });

  describe('invalid input', () => {
    it('returns null for an empty string', () => {
      expect(getTriggerTime('')).toBeNull();
    });

    it('returns null for a non-time string', () => {
      expect(getTriggerTime('invalid')).toBeNull();
    });

    it('returns null for a time with seconds (HH:mm:ss)', () => {
      expect(getTriggerTime('13:00:00')).toBeNull();
    });
  });

  describe('future time today (no advance)', () => {
    it('returns today at 13:00 when time has not passed', () => {
      const result = getTriggerTime('13:00');
      expect(result).not.toBeNull();
      expect(result!.getFullYear()).toBe(2026);
      expect(result!.getMonth()).toBe(4); // May
      expect(result!.getDate()).toBe(22);
      expect(result!.getHours()).toBe(13);
      expect(result!.getMinutes()).toBe(0);
    });

    it('handles a single-digit hour like "5:30"', () => {
      const result = getTriggerTime('5:30');
      // 5:30 has already passed at noon, so it schedules for tomorrow
      expect(result!.getDate()).toBe(23);
      expect(result!.getHours()).toBe(5);
      expect(result!.getMinutes()).toBe(30);
    });

    it('applies a positive offset to a future time', () => {
      // 13:00 + 15 min = 13:15, still future
      const result = getTriggerTime('13:00', 15);
      expect(result!.getDate()).toBe(22);
      expect(result!.getHours()).toBe(13);
      expect(result!.getMinutes()).toBe(15);
    });

    it('applies a negative offset that keeps the time in the future', () => {
      // 13:30 - 15 min = 13:15, still future
      const result = getTriggerTime('13:30', -15);
      expect(result!.getDate()).toBe(22);
      expect(result!.getHours()).toBe(13);
      expect(result!.getMinutes()).toBe(15);
    });
  });

  describe('past time — advances to tomorrow', () => {
    it('schedules for tomorrow at the same time when no tomorrow time given', () => {
      // 11:00 has already passed at noon
      const result = getTriggerTime('11:00');
      expect(result!.getDate()).toBe(23);
      expect(result!.getHours()).toBe(11);
      expect(result!.getMinutes()).toBe(0);
    });

    it('uses tomorrow time string when provided', () => {
      // 11:00 passed → use tomorrow's "11:30"
      const result = getTriggerTime('11:00', 0, '11:30');
      expect(result!.getDate()).toBe(23);
      expect(result!.getHours()).toBe(11);
      expect(result!.getMinutes()).toBe(30);
    });

    it('falls back to today time when tomorrow time string is invalid', () => {
      // 11:00 passed → tomorrowTime "bad" is invalid → use today's 11:00 + next day
      const result = getTriggerTime('11:00', 0, 'bad');
      expect(result!.getDate()).toBe(23);
      expect(result!.getHours()).toBe(11);
      expect(result!.getMinutes()).toBe(0);
    });

    it('applies offset to tomorrow time when provided', () => {
      // 11:00 passed → tomorrow "11:30" - 15 = 11:15 + advance 1 day
      const result = getTriggerTime('11:00', -15, '11:30');
      expect(result!.getDate()).toBe(23);
      expect(result!.getHours()).toBe(11);
      expect(result!.getMinutes()).toBe(15);
    });
  });

  describe('non-breaking space normalization', () => {
    it('normalizes a non-breaking space in the time string', () => {
      // "\u00A0" is a non-breaking space — should be treated like a regular space
      const result = getTriggerTime('13\u00A0:\u00A000');
      // After normalization "13 : 00" doesn't match /^(\d{1,2}):(\d{2})$/ → null
      expect(result).toBeNull();
    });

    it('parses correctly when non-breaking space is only around the colon separator', () => {
      // The format "13:00" with non-breaking space prefix/suffix gets trimmed → valid
      const result = getTriggerTime('\u00A013:00\u00A0');
      expect(result).not.toBeNull();
      expect(result!.getHours()).toBe(13);
    });
  });
});

// Helpers for scheduleNotificationsService holiday tests
const PRAYER_TIMES = {
  Imsak: '04:30', Fajr: '04:50', Sunrise: '06:20',
  Dhuhr: '12:30', Asr: '15:45', Maghrib: '18:20', Isha: '19:45',
} as any;

function buildParams(overrides: { holidaysEnabled?: boolean; yearlyHolidays?: any } = {}) {
  const { holidaysEnabled = true, yearlyHolidays } = overrides;
  return {
    prayerTimes: PRAYER_TIMES,
    tomorrowPrayerTimes: null,
    yearlyHolidays:
      yearlyHolidays === undefined
        ? {
          ramadan_start: ['2026-06-25'], // reminder 3d before → 06-22 (future) → scheduled
          laylat_qadr: ['2026-07-10'],   // reminder 1d before → 07-09 (future) → scheduled
          eid_fitr: ['2026-06-17'],      // reminder 2d before → 06-15 (passed) → skipped
          eid_adha: ['2025-06-06'],      // no upcoming date → skipped
        }
        : yearlyHolidays,
    config: {
      notifSettings: { volume: 1, vibration: 'short', snooze: 5 },
      prayers: {}, // optional-chained → no prayer notifications
      events: {},  // optional-chained → no event notifications
      specials: { Holidays: { enabled: holidaysEnabled } },
    },
    language: 'en',
    tr: { labels: {} },
  } as any;
}

function holidayCalls() {
  return mockCreateTrigger.mock.calls.filter(
    (c) => typeof c[0]?.id === 'string' && c[0].data?.subType === 'islamic-holiday'
  );
}

describe('scheduleNotificationsService — Islamic holiday reminders', () => {
  // System time fixed at 2026-06-16 12:00 local → toDateKey() === "2026-06-16"
  const NOW = new Date(2026, 5, 16, 12, 0, 0);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.setSystemTime(NOW);
  });

  it('schedules a reminder for each upcoming holiday whose reminder date is still in the future', async () => {
    await scheduleNotificationsService(buildParams());

    const ids = holidayCalls().map((c) => c[0].id);
    expect(ids).toContain('special-ramadan_start');
    expect(ids).toContain('special-laylat_qadr');
  });

  it('skips a holiday whose reminder date has already passed', async () => {
    await scheduleNotificationsService(buildParams());

    const ids = holidayCalls().map((c) => c[0].id);
    // eid_fitr is upcoming (2026-06-17) but its 2-day-before reminder (06-15) is in the past
    expect(ids).not.toContain('special-eid_fitr');
  });

  it('skips a holiday that has no upcoming date', async () => {
    await scheduleNotificationsService(buildParams());

    const ids = holidayCalls().map((c) => c[0].id);
    expect(ids).not.toContain('special-eid_adha');
  });

  it('builds the reminder with stable id, timestamp trigger and holiday metadata', async () => {
    await scheduleNotificationsService(buildParams());

    const call = holidayCalls().find((c) => c[0].id === 'special-ramadan_start');
    expect(call).toBeDefined();

    const [notification, trigger] = call!;
    expect(notification.title).toBe('» Ramadan «');
    expect(notification.body).toBe('First day of Ramadan fasting · 25.06.2026');
    expect(notification.data).toMatchObject({
      type: 'special',
      subType: 'islamic-holiday',
      holidayType: 'ramadan_start',
    });
    // 3 days before 2026-06-25 at 09:00 local
    expect(trigger.type).toBe('timestamp');
    expect(trigger.timestamp).toBe(new Date(2026, 5, 22, 9, 0, 0, 0).getTime());
  });

  it('schedules no holiday reminders when the Holidays special is disabled', async () => {
    await scheduleNotificationsService(buildParams({ holidaysEnabled: false }));
    expect(holidayCalls()).toHaveLength(0);
  });

  it('schedules no holiday reminders when there are no holidays loaded', async () => {
    await scheduleNotificationsService(buildParams({ yearlyHolidays: null }));
    expect(holidayCalls()).toHaveLength(0);
  });
});

describe('getVibrationChannelId', () => {
  it('maps short/medium to the versioned channel ids', () => {
    expect(getVibrationChannelId('short')).toBe('nejonprayer-vib-short-v2');
    expect(getVibrationChannelId('medium')).toBe('nejonprayer-vib-medium-v2');
  });

  it('leaves off/long unversioned', () => {
    expect(getVibrationChannelId('off')).toBe('nejonprayer-vib-off');
    expect(getVibrationChannelId('long')).toBe('nejonprayer-vib-long');
  });

  it('maps the legacy "on" setting to its own legacy channel', () => {
    expect(getVibrationChannelId('on')).toBe('nejonprayer-vib-on');
  });

  it('defaults to short when vibration is undefined or unrecognized', () => {
    expect(getVibrationChannelId(undefined)).toBe('nejonprayer-vib-short-v2');
    expect(getVibrationChannelId('bogus')).toBe('nejonprayer-vib-short-v2');
  });
});

describe('sweepStaleDisplayedNotifications', () => {
  // System time fixed at 2026-05-22 05:00 local → toDateKey() === "2026-05-22"
  const NOW = new Date(2026, 4, 22, 5, 0, 0);
  const yesterday = new Date(2026, 4, 21, 13, 0, 0).getTime();
  const todayMorning = new Date(2026, 4, 22, 4, 50, 0).getTime();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.setSystemTime(NOW);
    mockGetDisplayed.mockResolvedValue([
      { notification: { id: 'prayer-dhuhr', data: { type: 'prayer' } }, date: String(yesterday) },               // earlier day → cancel
      { notification: { id: 'special-friday', data: { type: 'special' } }, date: String(yesterday) },            // earlier day → cancel
      { notification: { id: 'prayer-reminder-x', data: { type: 'prayer-reminder' } }, date: String(yesterday) }, // earlier day → cancel
      { notification: { id: '0', data: {} }, date: String(yesterday) },                                          // earlier day → cancel
      { notification: { id: 'prayer-fajr', data: { type: 'prayer' } }, date: String(todayMorning) },             // today → keep
    ]);
  });

  it('cancels every notification shown on an earlier day, regardless of type', async () => {
    await sweepStaleDisplayedNotifications();
    expect(mockCancelDisplayed).toHaveBeenCalledWith('prayer-dhuhr');
    expect(mockCancelDisplayed).toHaveBeenCalledWith('special-friday');
    expect(mockCancelDisplayed).toHaveBeenCalledWith('prayer-reminder-x');
    expect(mockCancelDisplayed).toHaveBeenCalledWith('0');
    expect(mockCancelDisplayed).toHaveBeenCalledTimes(4);
  });

  it("keeps today's notifications", async () => {
    await sweepStaleDisplayedNotifications();
    expect(mockCancelDisplayed).not.toHaveBeenCalledWith('prayer-fajr');
  });
});
