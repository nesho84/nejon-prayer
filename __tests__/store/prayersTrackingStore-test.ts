import { cleanOldEntries, usePrayersTrackingStore } from '@/store/prayersTrackingStore';
import { toDateKey } from '@/utils/datetime';

jest.mock('@/store/storage', () => ({
  mmkvStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

const TODAY = toDateKey();

// Build a PrayerMark for fixtures (cleanOldEntries only inspects date keys, not values)
const prayed = (over: Record<string, unknown> = {}) => ({
  status: 'prayed' as const,
  markedAt: null,
  unmarkedAt: null,
  source: 'unknown' as const,
  toggles: 0,
  ...over,
});

beforeEach(() => {
  usePrayersTrackingStore.setState({ tracking: {}, celebratedDate: null, isReady: false });
});

describe('prayersTrackingStore — markPrayed', () => {
  it('marks a prayer for today', async () => {
    await usePrayersTrackingStore.getState().markPrayed('Fajr');
    expect(usePrayersTrackingStore.getState().tracking[TODAY]?.Fajr?.status).toBe('prayed');
  });

  it('marks a prayer for a specific date key', async () => {
    await usePrayersTrackingStore.getState().markPrayed('Dhuhr', '2026-01-01');
    expect(usePrayersTrackingStore.getState().tracking['2026-01-01']?.Dhuhr?.status).toBe('prayed');
  });

  it('returns false when not all 5 prayers are done', async () => {
    const result = await usePrayersTrackingStore.getState().markPrayed('Fajr');
    expect(result).toBe(false);
  });

  it('returns true when all 5 main prayers are done for today', async () => {
    const store = usePrayersTrackingStore.getState();
    await store.markPrayed('Fajr');
    await store.markPrayed('Dhuhr');
    await store.markPrayed('Asr');
    await store.markPrayed('Maghrib');
    const result = await store.markPrayed('Isha');
    expect(result).toBe(true);
  });

  it('returns false when all 5 done but for a past date', async () => {
    const store = usePrayersTrackingStore.getState();
    const PAST = '2020-01-01';
    await store.markPrayed('Fajr', PAST);
    await store.markPrayed('Dhuhr', PAST);
    await store.markPrayed('Asr', PAST);
    await store.markPrayed('Maghrib', PAST);
    const result = await store.markPrayed('Isha', PAST);
    expect(result).toBe(false);
  });

  it('returns false when only 4 of 5 main prayers are done', async () => {
    const store = usePrayersTrackingStore.getState();
    await store.markPrayed('Fajr');
    await store.markPrayed('Dhuhr');
    await store.markPrayed('Asr');
    const result = await store.markPrayed('Maghrib');
    expect(result).toBe(false);
  });

  it('returns true again after unmark + re-mark completes all 5', async () => {
    const store = usePrayersTrackingStore.getState();
    await store.markPrayed('Fajr');
    await store.markPrayed('Dhuhr');
    await store.markPrayed('Asr');
    await store.markPrayed('Maghrib');
    await store.markPrayed('Isha');
    // Unmark one, then re-mark it — should return true again
    usePrayersTrackingStore.getState().unmarkPrayed('Isha');
    const result = await usePrayersTrackingStore.getState().markPrayed('Isha');
    expect(result).toBe(true);
  });

  it('is idempotent — re-tapping the same prayer keeps it prayed without corrupting the day', async () => {
    const store = usePrayersTrackingStore.getState();
    await store.markPrayed('Fajr');
    await store.markPrayed('Fajr');
    const day = usePrayersTrackingStore.getState().tracking[TODAY];
    expect(day?.Fajr?.status).toBe('prayed');
    // No other prayer was touched by the re-tap.
    expect(Object.keys(day ?? {})).toEqual(['Fajr']);
  });

  it('re-tapping the completing prayer still reports all-done (no broken celebration)', async () => {
    const store = usePrayersTrackingStore.getState();
    await store.markPrayed('Fajr');
    await store.markPrayed('Dhuhr');
    await store.markPrayed('Asr');
    await store.markPrayed('Maghrib');
    await store.markPrayed('Isha');
    // Tapping Isha again on an already-complete day returns true again, idempotently.
    const result = await usePrayersTrackingStore.getState().markPrayed('Isha');
    expect(result).toBe(true);
  });

  it('preserves other days when marking today', async () => {
    await usePrayersTrackingStore.getState().markPrayed('Fajr', '2026-01-15');
    await usePrayersTrackingStore.getState().markPrayed('Dhuhr');
    const state = usePrayersTrackingStore.getState().tracking;
    expect(state['2026-01-15']?.Fajr?.status).toBe('prayed');
    expect(state[TODAY]?.Dhuhr?.status).toBe('prayed');
  });
});

describe('prayersTrackingStore — mark metadata', () => {
  it('records source, timestamp and toggle count on mark', async () => {
    await usePrayersTrackingStore.getState().markPrayed('Fajr', '2026-01-01', 'notif-bg');
    const mark = usePrayersTrackingStore.getState().tracking['2026-01-01']?.Fajr;
    expect(mark?.source).toBe('notif-bg');
    expect(mark?.markedAt).toEqual(expect.any(String));
    expect(mark?.unmarkedAt).toBeNull();
    expect(mark?.toggles).toBe(1);
  });

  it('defaults source to "unknown" when omitted', async () => {
    await usePrayersTrackingStore.getState().markPrayed('Dhuhr');
    expect(usePrayersTrackingStore.getState().tracking[TODAY]?.Dhuhr?.source).toBe('unknown');
  });

  it('records unmarkedAt and bumps toggles on unmark, keeping prior markedAt', async () => {
    await usePrayersTrackingStore.getState().markPrayed('Fajr', TODAY, 'home');
    const markedAt = usePrayersTrackingStore.getState().tracking[TODAY]?.Fajr?.markedAt;
    usePrayersTrackingStore.getState().unmarkPrayed('Fajr', TODAY, 'home');
    const mark = usePrayersTrackingStore.getState().tracking[TODAY]?.Fajr;
    expect(mark?.status).toBeNull();
    expect(mark?.unmarkedAt).toEqual(expect.any(String));
    expect(mark?.markedAt).toBe(markedAt); // prior mark timestamp preserved
    expect(mark?.toggles).toBe(2);
  });
});

describe('prayersTrackingStore — unmarkPrayed', () => {
  it('sets a prayer status to null', async () => {
    await usePrayersTrackingStore.getState().markPrayed('Fajr');
    usePrayersTrackingStore.getState().unmarkPrayed('Fajr');
    expect(usePrayersTrackingStore.getState().tracking[TODAY]?.Fajr?.status).toBeNull();
  });

  it('unmarks a prayer for a specific date key', async () => {
    await usePrayersTrackingStore.getState().markPrayed('Asr', '2026-05-01');
    usePrayersTrackingStore.getState().unmarkPrayed('Asr', '2026-05-01');
    expect(usePrayersTrackingStore.getState().tracking['2026-05-01']?.Asr?.status).toBeNull();
  });
});

describe('prayersTrackingStore — setCelebrated', () => {
  it('stores the date key in celebratedDate', () => {
    usePrayersTrackingStore.getState().setCelebrated(TODAY);
    expect(usePrayersTrackingStore.getState().celebratedDate).toBe(TODAY);
  });

  it('overwrites previous celebratedDate', () => {
    usePrayersTrackingStore.getState().setCelebrated('2026-01-01');
    usePrayersTrackingStore.getState().setCelebrated(TODAY);
    expect(usePrayersTrackingStore.getState().celebratedDate).toBe(TODAY);
  });
});

describe('cleanOldEntries', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-22'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns empty object for empty tracking', () => {
    expect(cleanOldEntries({})).toEqual({});
  });

  it('keeps an entry from today', () => {
    const tracking = { '2026-05-22': { Fajr: prayed() } };
    expect(cleanOldEntries(tracking)).toEqual(tracking);
  });

  it('keeps an entry from 30 days ago', () => {
    const tracking = { '2026-04-22': { Dhuhr: prayed() } };
    expect(cleanOldEntries(tracking)).toEqual(tracking);
  });

  it('keeps an entry from exactly 37 days ago (boundary — equal to cutoff)', () => {
    // 37 days before 2026-05-22 = 2026-04-15
    const tracking = { '2026-04-15': { Asr: prayed() } };
    expect(cleanOldEntries(tracking)).toEqual(tracking);
  });

  it('removes an entry from 38 days ago', () => {
    // 38 days before 2026-05-22 = 2026-04-14
    const tracking = { '2026-04-14': { Maghrib: prayed() } };
    expect(cleanOldEntries(tracking)).toEqual({});
  });

  it('removes old entries and keeps recent ones', () => {
    const tracking = {
      '2025-12-01': { Fajr: prayed() },
      '2026-04-14': { Dhuhr: prayed() },
      '2026-04-15': { Asr: prayed() },
      '2026-05-22': { Isha: prayed() },
    };
    expect(cleanOldEntries(tracking)).toEqual({
      '2026-04-15': { Asr: prayed() },
      '2026-05-22': { Isha: prayed() },
    });
  });
});
