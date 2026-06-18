import { isTimePast } from '@/utils/time';

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2024, 0, 15, 12, 0, 0)); // Mon Jan 15 2024 12:00:00
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe('isTimePast', () => {
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