import { getMonthRows, getWeekDays } from '@/utils/calendar';

const JAN_15_2024 = new Date(2024, 0, 15); // Monday

describe('getWeekDays', () => {
  it('returns 7 days', () => {
    expect(getWeekDays(JAN_15_2024)).toHaveLength(7);
  });

  it('starts on Monday', () => {
    expect(getWeekDays(JAN_15_2024)[0].getDay()).toBe(1); // 1 = Monday
  });

  it('ends on Sunday', () => {
    expect(getWeekDays(JAN_15_2024)[6].getDay()).toBe(0); // 0 = Sunday
  });

  it('returns correct dates for the week of Jan 15 2024', () => {
    const days = getWeekDays(JAN_15_2024);
    expect(days[0].getDate()).toBe(15); // Monday Jan 15
    expect(days[6].getDate()).toBe(21); // Sunday Jan 21
  });
});

describe('getMonthRows', () => {
  it('every row has 7 items (grid is fully padded)', () => {
    getMonthRows(JAN_15_2024).forEach(row => expect(row).toHaveLength(7));
  });

  it('first item is the current month since Jan 2024 starts on Monday', () => {
    expect(getMonthRows(JAN_15_2024)[0][0].isPrevMonth).toBe(false); // Jan 1 2024 is a Monday, no padding
  });

  it('contains 31 current-month day entries for January', () => {
    const dayEntries = getMonthRows(JAN_15_2024).flat().filter(item => !item.isPrevMonth && !item.isNextMonth);
    expect(dayEntries).toHaveLength(31);
  });

  it('has leading padding when month starts on a non-Monday', () => {
    // March 2024 starts on Friday (offset = 4)
    const rows = getMonthRows(new Date(2024, 2, 1));
    expect(rows[0][0].isPrevMonth).toBe(true);
    expect(rows.flat().filter(item => item.isPrevMonth)).toHaveLength(4);
  });

  it('has 6 leading padding cells when month starts on Sunday', () => {
    // September 2024 starts on Sunday (offset = 6)
    const rows = getMonthRows(new Date(2024, 8, 1));
    expect(rows.flat().filter(item => item.isPrevMonth)).toHaveLength(6);
  });

  it('first current-month day entry has date 1', () => {
    const first = getMonthRows(JAN_15_2024).flat().find(item => !item.isPrevMonth && !item.isNextMonth);
    expect(first?.date.getDate()).toBe(1);
  });

  it('last current-month day entry matches days in month', () => {
    // Feb 2024 — leap year, 29 days
    const days = getMonthRows(new Date(2024, 1, 15)).flat().filter(item => !item.isPrevMonth && !item.isNextMonth);
    expect(days).toHaveLength(29);
    expect(days[days.length - 1].date.getDate()).toBe(29);
  });

  it('pads the final row with next-month days (consistent with the week view)', () => {
    // June 2026 ends on Tue 30 → final row is 29 30 + Jul 1–5
    const rows = getMonthRows(new Date(2026, 5, 30));
    const lastRow = rows[rows.length - 1];
    expect(lastRow).toHaveLength(7);
    expect(lastRow.map(item => item.date.getDate())).toEqual([29, 30, 1, 2, 3, 4, 5]);
    expect(lastRow.slice(2).every(item => item.isNextMonth)).toBe(true);
  });

  it('fills BOTH ends with real days when the month starts and ends mid-week (July 2026)', () => {
    // July 2026 starts Wed and ends Fri
    const rows = getMonthRows(new Date(2026, 6, 15));

    // No empty cells anywhere
    rows.forEach(row => expect(row).toHaveLength(7));

    // Top row: real previous-month days (Jun 29, 30) then Jul 1–5 — not empty padding
    expect(rows[0].map(item => item.date.getDate())).toEqual([29, 30, 1, 2, 3, 4, 5]);
    expect(rows[0][0].isPrevMonth).toBe(true);  // Jun 29
    expect(rows[0][1].isPrevMonth).toBe(true);  // Jun 30
    expect(rows[0][2].isPrevMonth).toBe(false); // Jul 1

    // Bottom row: trailing next-month (Aug) days
    expect(rows[rows.length - 1].some(item => item.isNextMonth)).toBe(true);
  });
});
