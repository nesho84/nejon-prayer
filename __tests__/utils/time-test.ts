import { isTimePast } from '@/utils/time';

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2024, 0, 15, 12, 0, 0)); // Mon Jan 15 2024 12:00:00
});

afterEach(() => {
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
});