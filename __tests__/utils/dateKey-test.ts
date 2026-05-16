import { keyToDate, toDateKey } from '@/utils/dateKey';

describe('toDateKey', () => {
  it('formats a date correctly', () => {
    const date = new Date(2024, 0, 5); // Jan 5 2024
    expect(toDateKey(date)).toBe('2024-01-05');
  });

  it('pads single digit month and day', () => {
    const date = new Date(2024, 2, 9); // Mar 9 2024
    expect(toDateKey(date)).toBe('2024-03-09');
  });

  it('returns today when no date is passed', () => {
    const today = new Date();
    const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(toDateKey()).toBe(expected);
  });
});

describe('keyToDate', () => {
  it('parses a date key back to a local Date', () => {
    const date = keyToDate('2024-01-05');
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(0); // January
    expect(date.getDate()).toBe(5);
  });
});