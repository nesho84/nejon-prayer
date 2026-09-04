import { getHolidayDate, getNextHoliday, getYearlyHolidays } from '@/services/holidaysService';
import { HOLIDAY_CONFIG, HolidayName, YearlyHolidays } from '@/types/holiday.types';

// Helper — build a YearlyHolidays map from partial entries
function makeHolidays(entries: Partial<Record<HolidayName, string[]>>): YearlyHolidays {
  return entries;
}

// getHolidayDate — next occurrence on or after `today`
describe('getHolidayDate', () => {
  it('returns the next date on or after today, ignoring past dates', () => {
    const holidays = makeHolidays({ eid_fitr: ['2026-01-01', '2026-03-20', '2027-03-10'] });
    expect(getHolidayDate(holidays, 'eid_fitr', '2026-02-01')).toBe('2026-03-20');
  });

  it('includes a date that equals today (boundary, >=)', () => {
    const holidays = makeHolidays({ eid_fitr: ['2026-03-20'] });
    expect(getHolidayDate(holidays, 'eid_fitr', '2026-03-20')).toBe('2026-03-20');
  });

  it('returns the earliest upcoming when several future dates exist', () => {
    const holidays = makeHolidays({ ramadan_start: ['2027-01-28', '2026-02-08'] });
    expect(getHolidayDate(holidays, 'ramadan_start', '2025-12-01')).toBe('2026-02-08');
  });

  it('returns null when all dates are in the past', () => {
    const holidays = makeHolidays({ eid_adha: ['2025-06-06'] });
    expect(getHolidayDate(holidays, 'eid_adha', '2026-01-01')).toBeNull();
  });

  it('returns null when the holiday has no dates', () => {
    expect(getHolidayDate({}, 'laylat_qadr', '2026-01-01')).toBeNull();
  });
});

// getNextHoliday — nearest holiday within its showFromDays window
// (daysUntil is always >= 1; the holiday's own day is hidden)
describe('getNextHoliday', () => {
  it('returns null when there are no holidays', () => {
    expect(getNextHoliday({}, '2026-03-01')).toBeNull();
  });

  it('returns a holiday inside its window', () => {
    // ramadan_start window = 7 days; date is 5 days away
    const holidays = makeHolidays({ ramadan_start: ['2026-03-06'] });
    expect(getNextHoliday(holidays, '2026-03-01')).toEqual({
      name: 'ramadan_start',
      gregorianDate: '2026-03-06',
      daysUntil: 5,
    });
  });

  it('includes a holiday exactly showFromDays away (boundary)', () => {
    expect(HOLIDAY_CONFIG.ramadan_start.showFromDays).toBe(7); // guard the assumption
    const holidays = makeHolidays({ ramadan_start: ['2026-03-08'] }); // 7 days away
    expect(getNextHoliday(holidays, '2026-03-01')?.daysUntil).toBe(7);
  });

  it('excludes a holiday one day beyond its window', () => {
    const holidays = makeHolidays({ ramadan_start: ['2026-03-09'] }); // 8 days away
    expect(getNextHoliday(holidays, '2026-03-01')).toBeNull();
  });

  it('hides the holiday on the day itself (daysUntil === 0)', () => {
    const holidays = makeHolidays({ eid_fitr: ['2026-03-01'] });
    expect(getNextHoliday(holidays, '2026-03-01')).toBeNull();
  });

  it('ignores holidays already in the past', () => {
    const holidays = makeHolidays({ eid_fitr: ['2026-02-25'] });
    expect(getNextHoliday(holidays, '2026-03-01')).toBeNull();
  });

  it('returns the closest holiday when several are in-window (collision)', () => {
    // laylat_qadr 2 days away (window 3) vs eid_fitr 5 days away (window 7)
    const holidays = makeHolidays({
      laylat_qadr: ['2026-03-03'],
      eid_fitr: ['2026-03-06'],
    });
    const result = getNextHoliday(holidays, '2026-03-01');
    expect(result?.name).toBe('laylat_qadr');
    expect(result?.daysUntil).toBe(2);
  });

  it("respects each holiday's own (narrower) window", () => {
    // laylat_qadr window = 3; date 5 days away → excluded, even though a 7-day window would include it
    expect(HOLIDAY_CONFIG.laylat_qadr.showFromDays).toBe(3);
    const holidays = makeHolidays({ laylat_qadr: ['2026-03-06'] });
    expect(getNextHoliday(holidays, '2026-03-01')).toBeNull();
  });

  it('crosses the Gregorian year boundary', () => {
    // today late Dec; ramadan 4 days away in early Jan of the next year (window 7)
    const holidays = makeHolidays({ ramadan_start: ['2027-01-03'] });
    const result = getNextHoliday(holidays, '2026-12-30');
    expect(result?.name).toBe('ramadan_start');
    expect(result?.daysUntil).toBe(4);
  });
});

// Helpers — fetch responses + Aladhan "holiday day" factory
// NOTE: Gregorian dates below are synthetic fixtures chosen to exercise the year-filter
// and cross-fetch merge — not real astronomical dates.
function jsonResponse(data: unknown) {
  return Promise.resolve({ ok: true, json: async () => data });
}

function holidayDay(hijriMonth: number, hijriDay: number, gregorianDate: string) {
  return {
    hijri: { day: String(hijriDay), month: { number: hijriMonth }, holidays: ['holiday'] },
    gregorian: { date: gregorianDate }, // "DD-MM-YYYY"
  };
}

// Hijri 1446 (prev): one too-old date (dropped) + one that lands early in 2026 (kept)
const PREV = [
  holidayDay(12, 10, '08-06-2025'), // eid_adha  → 2025  OUT (too old)
  holidayDay(1, 1, '02-01-2026'),   // hijri_new_year → 2026  IN (prev-year boundary catch)
];
// Hijri 1447 (this): the bulk + one non-matching day (ignored)
const THIS = [
  holidayDay(9, 1, '18-02-2026'),   // ramadan_start → 2026  IN
  holidayDay(10, 1, '20-03-2026'),  // eid_fitr      → 2026  IN
  holidayDay(12, 10, '28-05-2026'), // eid_adha      → 2026  IN
  holidayDay(5, 3, '01-01-2026'),   // no holiday at month 5 day 3 → IGNORED
];
// Hijri 1448 (next): a merge case + one too-far date (dropped)
const NEXT = [
  holidayDay(9, 1, '08-02-2027'),   // ramadan_start → 2027  IN (merges with THIS)
  holidayDay(12, 10, '16-05-2028'), // eid_adha      → 2028  OUT (too far)
];

type YearOpts = { prev?: 'reject'; cur?: 'reject'; next?: 'reject' };

function mockFetchRouting(opts: YearOpts = {}) {
  (globalThis.fetch as jest.Mock).mockImplementation((url: string) => {
    if (url.includes('/gToH/')) return jsonResponse({ data: { hijri: { year: '1447' } } });
    if (url.includes('/islamicHolidaysByHijriYear/1446'))
      return opts.prev === 'reject' ? Promise.reject(new Error('prev fail')) : jsonResponse({ data: PREV });
    if (url.includes('/islamicHolidaysByHijriYear/1447'))
      return opts.cur === 'reject' ? Promise.reject(new Error('this fail')) : jsonResponse({ data: THIS });
    if (url.includes('/islamicHolidaysByHijriYear/1448'))
      return opts.next === 'reject' ? Promise.reject(new Error('next fail')) : jsonResponse({ data: NEXT });
    return Promise.reject(new Error('unexpected url: ' + url));
  });
}

// getYearlyHolidays — fetch, normalize, filter to current + next Gregorian year
describe('getYearlyHolidays', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-16T12:00:00Z')); // currentGregorianYear = 2026
    globalThis.fetch = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('filters prev/this/next Hijri years to the current+next Gregorian year, merging dates', async () => {
    mockFetchRouting();
    const { holidays, complete } = await getYearlyHolidays();

    expect(complete).toBe(true);
    // prev-Hijri-year date that lands early in the current Gregorian year is kept
    expect(holidays.hijri_new_year).toEqual(['2026-01-02']);
    // same holiday from this + next Hijri year merges into one chronological list
    expect(holidays.ramadan_start).toEqual(['2026-02-18', '2027-02-08']);
    expect(holidays.eid_fitr).toEqual(['2026-03-20']);
    // 2025 (too old) and 2028 (too far) eid_adha dates are dropped
    expect(holidays.eid_adha).toEqual(['2026-05-28']);
    // a Hijri day that matches no known holiday is ignored
    expect(holidays.ashura).toBeUndefined();
  });

  it('keeps successful years when one Hijri-year fetch fails (allSettled)', async () => {
    mockFetchRouting({ next: 'reject' });
    const { holidays, complete } = await getYearlyHolidays();

    expect(complete).toBe(false);
    // next-year Ramadan (2027) is lost, but this-year (2026) survives
    expect(holidays.ramadan_start).toEqual(['2026-02-18']);
    expect(holidays.eid_fitr).toEqual(['2026-03-20']);
    // prev-year data still merged in
    expect(holidays.hijri_new_year).toEqual(['2026-01-02']);
  });

  it('throws when every Hijri-year fetch fails', async () => {
    mockFetchRouting({ prev: 'reject', cur: 'reject', next: 'reject' });
    await expect(getYearlyHolidays()).rejects.toThrow('All Hijri-year holiday fetches failed');
  });

  it('dedupes the same holiday date returned by overlapping Hijri-year fetches', async () => {
    // ramadan_start on 2026-02-18 is returned by BOTH the current and next Hijri-year fetches
    (globalThis.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/gToH/')) return jsonResponse({ data: { hijri: { year: '1447' } } });
      if (url.includes('/islamicHolidaysByHijriYear/1446')) return jsonResponse({ data: [] });
      if (url.includes('/islamicHolidaysByHijriYear/1447')) return jsonResponse({ data: [holidayDay(9, 1, '18-02-2026')] });
      if (url.includes('/islamicHolidaysByHijriYear/1448')) return jsonResponse({ data: [holidayDay(9, 1, '18-02-2026')] });
      return Promise.reject(new Error('unexpected url: ' + url));
    });

    const { holidays } = await getYearlyHolidays();
    expect(holidays.ramadan_start).toEqual(['2026-02-18']); // kept once, not duplicated
  });

  it('throws when the gToH lookup returns a non-OK response', async () => {
    (globalThis.fetch as jest.Mock).mockImplementation((url: string) =>
      url.includes('/gToH/') ? Promise.resolve({ ok: false, status: 500 }) : jsonResponse({ data: [] })
    );
    await expect(getYearlyHolidays()).rejects.toThrow('HTTP error! status: 500');
  });
});
