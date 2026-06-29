import { getMonthRows, getWeekDays } from '@/utils/calendar';

const JAN_15_2024 = new Date(2024, 0, 15); // Monday

describe('getCurrentWeekDays', () => {
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

describe('getCurrentMonthRows', () => {
  it('all rows except the last have 7 items', () => {
    const rows = getMonthRows(JAN_15_2024);
    rows.slice(0, -1).forEach(row => expect(row).toHaveLength(7));
  });

  it('first item is NOT empty padding since Jan 2024 starts on Monday', () => {
    expect(getMonthRows(JAN_15_2024)[0][0].empty).toBe(false); // Jan 1 2024 is a Monday, no padding
  });

  it('contains 31 day entries for January', () => {
    const dayEntries = getMonthRows(JAN_15_2024).flat().filter(item => !item.empty);
    expect(dayEntries).toHaveLength(31);
  });

  it('has leading padding when month starts on a non-Monday', () => {
    // March 2024 starts on Friday (offset = 4)
    const rows = getMonthRows(new Date(2024, 2, 1));
    expect(rows[0][0].isPrevMonth).toBe(true);
    expect(rows.flat().filter(item => item.isPrevMonth)).toHaveLength(4);
  });

  it('has 6 padding cells when month starts on Sunday', () => {
    // September 2024 starts on Sunday (offset = 6)
    const rows = getMonthRows(new Date(2024, 8, 1));
    expect(rows.flat().filter(item => item.isPrevMonth)).toHaveLength(6);
  });

  it('first real day entry has date 1', () => {
    const first = getMonthRows(JAN_15_2024).flat().find(item => !item.empty);
    expect(first?.date?.getDate()).toBe(1);
  });

  it('last real day entry matches days in month', () => {
    // Feb 2024 — leap year, 29 days
    const days = getMonthRows(new Date(2024, 1, 15)).flat().filter(item => !item.isPrevMonth);
    expect(days).toHaveLength(29);
    expect(days[days.length - 1].date?.getDate()).toBe(29);
  });
});
