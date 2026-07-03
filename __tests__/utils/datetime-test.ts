import { isTimePast, keyToDate, toDateKey } from '@/utils/datetime';

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

describe('isTimePast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2024, 0, 15, 12, 0, 0)); // Mon Jan 15 2024 12:00:00
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('returns true when time has passed', () => {
    expect(isTimePast('11:00')).toBe(true);
  });

  it('returns false when time has not passed', () => {
    expect(isTimePast('13:00')).toBe(false);
  });

  it('returns false when time is exactly now', () => {
    expect(isTimePast('12:00')).toBe(false);
  });

  it('returns true for one minute before now', () => {
    expect(isTimePast('11:59')).toBe(true);
  });

  it('returns false for one minute after now', () => {
    expect(isTimePast('12:01')).toBe(false);
  });
});

describe('isTimePast — midnight boundary', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('returns false at exactly midnight (00:00)', () => {
    jest.setSystemTime(new Date(2024, 0, 15, 0, 0, 0));
    expect(isTimePast('00:00')).toBe(false);
  });

  it('returns false for 23:59 when current time is 00:01 (still later today)', () => {
    jest.setSystemTime(new Date(2024, 0, 15, 0, 1, 0));
    expect(isTimePast('23:59')).toBe(false); // 23:59 is later today, not past
  });

  it('returns true for 00:00 when current time is 00:01', () => {
    jest.setSystemTime(new Date(2024, 0, 15, 0, 1, 0));
    expect(isTimePast('00:00')).toBe(true);
  });

  it('returns false for 23:59 when current time is 23:58', () => {
    jest.setSystemTime(new Date(2024, 0, 15, 23, 58, 0));
    expect(isTimePast('23:59')).toBe(false);
  });

  it('returns true for 23:58 when current time is 23:59', () => {
    jest.setSystemTime(new Date(2024, 0, 15, 23, 59, 0));
    expect(isTimePast('23:58')).toBe(true);
  });
});
