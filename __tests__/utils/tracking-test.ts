import { getDayPrayedCount, resolveTrackingDate } from '@/utils/tracking';

describe('getDayPrayedCount', () => {
  it('returns 0 when no tracking data exists for the day', () => {
    expect(getDayPrayedCount({}, '2024-01-05')).toBe(0);
  });

  it('returns 0 when no prayers are marked as prayed', () => {
    const tracking = { '2024-01-05': { Fajr: { status: null }, Dhuhr: { status: null }, Asr: { status: null }, Maghrib: { status: null }, Isha: { status: null } } } as const;
    expect(getDayPrayedCount(tracking, '2024-01-05')).toBe(0);
  });

  it('counts only prayers marked as prayed', () => {
    const tracking = { '2024-01-05': { Fajr: { status: 'prayed' }, Dhuhr: { status: 'prayed' }, Asr: { status: null }, Maghrib: { status: null }, Isha: { status: null } } } as const;
    expect(getDayPrayedCount(tracking, '2024-01-05')).toBe(2);
  });

  it('returns 5 when all main prayers are prayed', () => {
    const tracking = { '2024-01-05': { Fajr: { status: 'prayed' }, Dhuhr: { status: 'prayed' }, Asr: { status: 'prayed' }, Maghrib: { status: 'prayed' }, Isha: { status: 'prayed' } } } as const;
    expect(getDayPrayedCount(tracking, '2024-01-05')).toBe(5);
  });

  it('returns 0 for a different date key', () => {
    const tracking = { '2024-01-05': { Fajr: { status: 'prayed' } } } as const;
    expect(getDayPrayedCount(tracking, '2024-01-06')).toBe(0);
  });
});

describe('resolveTrackingDate', () => {
  const FAJR = '03:30';

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  // Same times day N+1, no reschedule — frozen "N" ignored, records the tap day.
  it('records the tap day for a daytime non-Isha tap (same-times day N+1)', () => {
    jest.setSystemTime(new Date(2026, 5, 29, 14, 0, 0));
    expect(resolveTrackingDate('Fajr', FAJR)).toBe('2026-06-29');
  });

  // Tap on N+2 with identical times — proves no off-by-one assumption.
  it('records the tap day on N+2 with identical times (no off-by-one)', () => {
    jest.setSystemTime(new Date(2026, 5, 30, 14, 0, 0));
    expect(resolveTrackingDate('Dhuhr', FAJR)).toBe('2026-06-30');
  });

  // Regression: normal daytime tap on a reschedule day.
  it('records today for a normal daytime tap (different-times day)', () => {
    jest.setSystemTime(new Date(2026, 5, 30, 13, 0, 0));
    expect(resolveTrackingDate('Asr', FAJR)).toBe('2026-06-30');
  });

  it('attributes a late-night Isha (00:15, before Fajr) to the previous day', () => {
    jest.setSystemTime(new Date(2026, 5, 30, 0, 15, 0));
    expect(resolveTrackingDate('Isha', FAJR)).toBe('2026-06-29');
  });

  // Isha rule never touches Fajr.
  it('attributes an early Fajr (03:40) to today, never yesterday', () => {
    jest.setSystemTime(new Date(2026, 5, 30, 3, 40, 0));
    expect(resolveTrackingDate('Fajr', FAJR)).toBe('2026-06-30');
  });

  // Isha pushed past midnight by a positive offset.
  it('attributes a post-midnight Isha tap (00:20) to the previous day', () => {
    jest.setSystemTime(new Date(2026, 5, 30, 0, 20, 0));
    expect(resolveTrackingDate('Isha', FAJR)).toBe('2026-06-29');
  });

  it('records today for any prayer tapped during the day, including Isha', () => {
    jest.setSystemTime(new Date(2026, 5, 30, 14, 0, 0));
    expect(resolveTrackingDate('Isha', FAJR)).toBe('2026-06-30');
    expect(resolveTrackingDate('Maghrib', FAJR)).toBe('2026-06-30');
  });

  // Locks the evening edge so the before-Fajr window can't bleed into the evening.
  it('records today for an evening Isha tap (22:00)', () => {
    jest.setSystemTime(new Date(2026, 5, 30, 22, 0, 0));
    expect(resolveTrackingDate('Isha', FAJR)).toBe('2026-06-30');
  });

  // No-Fajr path returns today — can't reintroduce the stale-date bug.
  it('records today when Fajr is unavailable (no boundary), even for Isha at 00:15', () => {
    jest.setSystemTime(new Date(2026, 5, 30, 0, 15, 0));
    expect(resolveTrackingDate('Isha', undefined)).toBe('2026-06-30');
  });
});