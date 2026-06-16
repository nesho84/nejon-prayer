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

import { scheduleNotificationsService } from '@/services/notificationsService';
import notifee from 'react-native-notify-kit';

const mockCreateTrigger = notifee.createTriggerNotification as jest.Mock;

// System time fixed at 2026-06-16 12:00 local → toDateKey() === "2026-06-16"
const NOW = new Date(2026, 5, 16, 12, 0, 0);

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

// Only the holiday reminders created by scheduleSpecialNotifications
function holidayCalls() {
  return mockCreateTrigger.mock.calls.filter(
    (c) => typeof c[0]?.id === 'string' && c[0].data?.subType === 'islamic-holiday'
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('scheduleNotificationsService — Islamic holiday reminders', () => {
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
    expect(notification.body).toBe('The holy month of fasting · 25.06.2026');
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
