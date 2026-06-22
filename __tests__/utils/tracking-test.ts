import { toDateKey } from '@/utils/datetime';
import { getDayPrayedCount, resolveTrackingDate } from '@/utils/tracking';

describe('getDayPrayedCount', () => {
  it('returns 0 when no tracking data exists for the day', () => {
    expect(getDayPrayedCount({}, '2024-01-05')).toBe(0);
  });

  it('returns 0 when no prayers are marked as prayed', () => {
    const tracking = { '2024-01-05': { Fajr: null, Dhuhr: null, Asr: null, Maghrib: null, Isha: null } } as const;
    expect(getDayPrayedCount(tracking, '2024-01-05')).toBe(0);
  });

  it('counts only prayers marked as prayed', () => {
    const tracking = { '2024-01-05': { Fajr: 'prayed', Dhuhr: 'prayed', Asr: null, Maghrib: null, Isha: null } } as const;
    expect(getDayPrayedCount(tracking, '2024-01-05')).toBe(2);
  });

  it('returns 5 when all main prayers are prayed', () => {
    const tracking = { '2024-01-05': { Fajr: 'prayed', Dhuhr: 'prayed', Asr: 'prayed', Maghrib: 'prayed', Isha: 'prayed' } } as const;
    expect(getDayPrayedCount(tracking, '2024-01-05')).toBe(5);
  });

  it('returns 0 for a different date key', () => {
    const tracking = { '2024-01-05': { Fajr: 'prayed' } } as const;
    expect(getDayPrayedCount(tracking, '2024-01-06')).toBe(0);
  });
});

describe('resolveTrackingDate', () => {
  it('returns today when no date is passed', () => {
    const today = toDateKey();
    expect(resolveTrackingDate(undefined)).toBe(today);
  });

  it('returns today when today is passed', () => {
    const today = toDateKey();
    expect(resolveTrackingDate(today)).toBe(today);
  });

  it('returns yesterday when yesterday is passed', () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterday = toDateKey(d);
    expect(resolveTrackingDate(yesterday)).toBe(yesterday);
  });

  it('returns today when an old date is passed', () => {
    const today = toDateKey();
    expect(resolveTrackingDate('2023-01-01')).toBe(today);
  });
});