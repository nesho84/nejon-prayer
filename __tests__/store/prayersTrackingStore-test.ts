jest.mock('@/store/storage', () => ({
  mmkvStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

import { cleanOldEntries, usePrayersTrackingStore } from '@/store/prayersTrackingStore';
import { toDateKey } from '@/utils/date';

const TODAY = toDateKey();

beforeEach(() => {
  usePrayersTrackingStore.setState({ tracking: {}, celebratedDate: null, isReady: false });
});

describe('prayersTrackingStore — markPrayed', () => {
  it('marks a prayer for today', () => {
    usePrayersTrackingStore.getState().markPrayed('Fajr');
    expect(usePrayersTrackingStore.getState().tracking[TODAY]?.Fajr).toBe('prayed');
  });

  it('marks a prayer for a specific date key', () => {
    usePrayersTrackingStore.getState().markPrayed('Dhuhr', '2026-01-01');
    expect(usePrayersTrackingStore.getState().tracking['2026-01-01']?.Dhuhr).toBe('prayed');
  });

  it('returns false when not all 5 prayers are done', () => {
    const result = usePrayersTrackingStore.getState().markPrayed('Fajr');
    expect(result).toBe(false);
  });

  it('returns true when all 5 main prayers are done for today', () => {
    const store = usePrayersTrackingStore.getState();
    store.markPrayed('Fajr');
    store.markPrayed('Dhuhr');
    store.markPrayed('Asr');
    store.markPrayed('Maghrib');
    const result = store.markPrayed('Isha');
    expect(result).toBe(true);
  });

  it('returns false when all 5 done but for a past date', () => {
    const store = usePrayersTrackingStore.getState();
    const PAST = '2020-01-01';
    store.markPrayed('Fajr', PAST);
    store.markPrayed('Dhuhr', PAST);
    store.markPrayed('Asr', PAST);
    store.markPrayed('Maghrib', PAST);
    const result = store.markPrayed('Isha', PAST);
    expect(result).toBe(false);
  });
});

describe('prayersTrackingStore — unmarkPrayed', () => {
  it('sets a prayer entry to null', () => {
    usePrayersTrackingStore.getState().markPrayed('Fajr');
    usePrayersTrackingStore.getState().unmarkPrayed('Fajr');
    expect(usePrayersTrackingStore.getState().tracking[TODAY]?.Fajr).toBeNull();
  });

  it('unmarks a prayer for a specific date key', () => {
    usePrayersTrackingStore.getState().markPrayed('Asr', '2026-05-01');
    usePrayersTrackingStore.getState().unmarkPrayed('Asr', '2026-05-01');
    expect(usePrayersTrackingStore.getState().tracking['2026-05-01']?.Asr).toBeNull();
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
    const tracking = { '2026-05-22': { Fajr: 'prayed' as const } };
    expect(cleanOldEntries(tracking)).toEqual(tracking);
  });

  it('keeps an entry from 30 days ago', () => {
    const tracking = { '2026-04-22': { Dhuhr: 'prayed' as const } };
    expect(cleanOldEntries(tracking)).toEqual(tracking);
  });

  it('keeps an entry from exactly 31 days ago (boundary — equal to cutoff)', () => {
    const tracking = { '2026-04-21': { Asr: 'prayed' as const } };
    expect(cleanOldEntries(tracking)).toEqual(tracking);
  });

  it('removes an entry from 32 days ago', () => {
    const tracking = { '2026-04-20': { Maghrib: 'prayed' as const } };
    expect(cleanOldEntries(tracking)).toEqual({});
  });

  it('removes old entries and keeps recent ones', () => {
    const tracking = {
      '2025-12-01': { Fajr: 'prayed' as const },
      '2026-04-20': { Dhuhr: 'prayed' as const },
      '2026-04-21': { Asr: 'prayed' as const },
      '2026-05-22': { Isha: 'prayed' as const },
    };
    expect(cleanOldEntries(tracking)).toEqual({
      '2026-04-21': { Asr: 'prayed' },
      '2026-05-22': { Isha: 'prayed' },
    });
  });
});