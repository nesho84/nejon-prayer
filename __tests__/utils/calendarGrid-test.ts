import { getCurrentMonthRows, getCurrentWeekDays } from '@/utils/calendarGrid';

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2024, 0, 15)); // Monday Jan 15 2024
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe('getCurrentWeekDays', () => {
  it('returns 7 days', () => {
    const days = getCurrentWeekDays();
    expect(days).toHaveLength(7);
  });

  it('starts on Monday', () => {
    const days = getCurrentWeekDays();
    expect(days[0].getDay()).toBe(1); // 1 = Monday
  });

  it('ends on Sunday', () => {
    const days = getCurrentWeekDays();
    expect(days[6].getDay()).toBe(0); // 0 = Sunday
  });

  it('returns correct dates for the week of Jan 15 2024', () => {
    const days = getCurrentWeekDays();
    expect(days[0].getDate()).toBe(15); // Monday Jan 15
    expect(days[6].getDate()).toBe(21); // Sunday Jan 21
  });
});

describe('getCurrentMonthRows', () => {
  it('all rows except the last have 7 items', () => {
    const rows = getCurrentMonthRows();
    rows.slice(0, -1).forEach(row => expect(row).toHaveLength(7));
  });

  it('first item is NOT empty padding since Jan 2024 starts on Monday', () => {
    const rows = getCurrentMonthRows();
    expect(rows[0][0].empty).toBe(false); // Jan 1 2024 is a Monday, no padding
  });

  it('contains 31 day entries for January', () => {
    const rows = getCurrentMonthRows();
    const dayEntries = rows.flat().filter(item => !item.empty);
    expect(dayEntries).toHaveLength(31);
  });

  it('has leading padding when month starts on a non-Monday', () => {
    // March 2024 starts on Friday (offset = 4)
    jest.setSystemTime(new Date(2024, 2, 1));
    const rows = getCurrentMonthRows();
    expect(rows[0][0].empty).toBe(true);
    const empties = rows.flat().filter(item => item.empty);
    expect(empties).toHaveLength(4);
  });

  it('has no padding when month starts on Monday', () => {
    // Jan 2024 starts on Monday
    jest.setSystemTime(new Date(2024, 0, 1));
    const rows = getCurrentMonthRows();
    expect(rows[0][0].empty).toBe(false);
  });

  it('has 6 padding cells when month starts on Sunday', () => {
    // September 2024 starts on Sunday (offset = 6)
    jest.setSystemTime(new Date(2024, 8, 1));
    const rows = getCurrentMonthRows();
    const empties = rows.flat().filter(item => item.empty);
    expect(empties).toHaveLength(6);
  });

  it('first real day entry has date 1', () => {
    const rows = getCurrentMonthRows();
    const first = rows.flat().find(item => !item.empty);
    expect(first?.date?.getDate()).toBe(1);
  });

  it('last real day entry matches days in month', () => {
    // Feb 2024 — leap year, 29 days
    jest.setSystemTime(new Date(2024, 1, 15));
    const rows = getCurrentMonthRows();
    const days = rows.flat().filter(item => !item.empty);
    expect(days).toHaveLength(29);
    expect(days[days.length - 1].date?.getDate()).toBe(29);
  });
});