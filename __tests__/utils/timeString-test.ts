import { getNotificationTriggerTime, isTimePast } from '@/utils/timeString';

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

describe('getNotificationTriggerTime', () => {
  it('returns null for invalid time format', () => {
    expect(getNotificationTriggerTime('invalid')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(getNotificationTriggerTime('')).toBeNull();
  });

  it('returns a future time when time has not passed today', () => {
    const result = getNotificationTriggerTime('13:00');
    expect(result).not.toBeNull();
    expect(result!.getDate()).toBe(15); // same day
    expect(result!.getHours()).toBe(13);
    expect(result!.getMinutes()).toBe(0);
  });

  it('schedules for tomorrow when time has already passed', () => {
    const result = getNotificationTriggerTime('11:00');
    expect(result).not.toBeNull();
    expect(result!.getDate()).toBe(16); // next day
  });

  it('applies positive offset correctly', () => {
    const result = getNotificationTriggerTime('13:00', 15);
    expect(result!.getHours()).toBe(13);
    expect(result!.getMinutes()).toBe(15);
  });

  it('applies negative offset correctly', () => {
    const result = getNotificationTriggerTime('13:00', -15);
    expect(result!.getHours()).toBe(12);
    expect(result!.getMinutes()).toBe(45);
  });

  it('uses tomorrows time when provided and time has passed', () => {
    const result = getNotificationTriggerTime('11:00', 0, '11:30');
    expect(result!.getDate()).toBe(16); // tomorrow
    expect(result!.getHours()).toBe(11);
    expect(result!.getMinutes()).toBe(30);
  });

  it('schedules for tomorrow when offset crosses midnight', () => {
    // 23:50 + 15 min offset = 00:05, which is past midnight so it becomes tomorrow
    const result = getNotificationTriggerTime('23:50', 15);
    expect(result).not.toBeNull();
    expect(result!.getDate()).toBe(16); // tomorrow
    expect(result!.getHours()).toBe(0);
    expect(result!.getMinutes()).toBe(5);
  });
});