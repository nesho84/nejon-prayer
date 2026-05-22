jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  init: jest.fn(),
}));

jest.mock('@/services/soundService', () => ({
  startSound: jest.fn(),
  stopSound: jest.fn(),
}));

jest.mock('react-native-notify-kit', () => ({
  __esModule: true,
  default: {},
  AndroidCategory: {},
  AndroidColor: {},
  AndroidImportance: {},
  AndroidStyle: {},
  AndroidVisibility: {},
  AndroidNotificationSetting: {},
  AuthorizationStatus: {},
  EventType: {},
  RepeatFrequency: {},
  TriggerType: {},
}));

import { getTriggerTime } from '@/services/notificationsService';

// System time fixed at 2026-05-22 12:00:00 local
const NOW = new Date(2026, 4, 22, 12, 0, 0);

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('getTriggerTime', () => {
  describe('invalid input', () => {
    it('returns null for an empty string', () => {
      expect(getTriggerTime('')).toBeNull();
    });

    it('returns null for a non-time string', () => {
      expect(getTriggerTime('invalid')).toBeNull();
    });

    it('returns null for a time with seconds (HH:mm:ss)', () => {
      expect(getTriggerTime('13:00:00')).toBeNull();
    });
  });

  describe('future time today (no advance)', () => {
    it('returns today at 13:00 when time has not passed', () => {
      const result = getTriggerTime('13:00');
      expect(result).not.toBeNull();
      expect(result!.getFullYear()).toBe(2026);
      expect(result!.getMonth()).toBe(4); // May
      expect(result!.getDate()).toBe(22);
      expect(result!.getHours()).toBe(13);
      expect(result!.getMinutes()).toBe(0);
    });

    it('handles a single-digit hour like "5:30"', () => {
      const result = getTriggerTime('5:30');
      // 5:30 has already passed at noon, so it schedules for tomorrow
      expect(result!.getDate()).toBe(23);
      expect(result!.getHours()).toBe(5);
      expect(result!.getMinutes()).toBe(30);
    });

    it('applies a positive offset to a future time', () => {
      // 13:00 + 15 min = 13:15, still future
      const result = getTriggerTime('13:00', 15);
      expect(result!.getDate()).toBe(22);
      expect(result!.getHours()).toBe(13);
      expect(result!.getMinutes()).toBe(15);
    });

    it('applies a negative offset that keeps the time in the future', () => {
      // 13:30 - 15 min = 13:15, still future
      const result = getTriggerTime('13:30', -15);
      expect(result!.getDate()).toBe(22);
      expect(result!.getHours()).toBe(13);
      expect(result!.getMinutes()).toBe(15);
    });
  });

  describe('past time — advances to tomorrow', () => {
    it('schedules for tomorrow at the same time when no tomorrow time given', () => {
      // 11:00 has already passed at noon
      const result = getTriggerTime('11:00');
      expect(result!.getDate()).toBe(23);
      expect(result!.getHours()).toBe(11);
      expect(result!.getMinutes()).toBe(0);
    });

    it('uses tomorrow time string when provided', () => {
      // 11:00 passed → use tomorrow's "11:30"
      const result = getTriggerTime('11:00', 0, '11:30');
      expect(result!.getDate()).toBe(23);
      expect(result!.getHours()).toBe(11);
      expect(result!.getMinutes()).toBe(30);
    });

    it('falls back to today time when tomorrow time string is invalid', () => {
      // 11:00 passed → tomorrowTime "bad" is invalid → use today's 11:00 + next day
      const result = getTriggerTime('11:00', 0, 'bad');
      expect(result!.getDate()).toBe(23);
      expect(result!.getHours()).toBe(11);
      expect(result!.getMinutes()).toBe(0);
    });

    it('applies offset to tomorrow time when provided', () => {
      // 11:00 passed → tomorrow "11:30" - 15 = 11:15 + advance 1 day
      const result = getTriggerTime('11:00', -15, '11:30');
      expect(result!.getDate()).toBe(23);
      expect(result!.getHours()).toBe(11);
      expect(result!.getMinutes()).toBe(15);
    });
  });

  describe('non-breaking space normalization', () => {
    it('normalizes a non-breaking space in the time string', () => {
      // "\u00A0" is a non-breaking space — should be treated like a regular space
      const result = getTriggerTime('13\u00A0:\u00A000');
      // After normalization "13 : 00" doesn't match /^(\d{1,2}):(\d{2})$/ → null
      expect(result).toBeNull();
    });

    it('parses correctly when non-breaking space is only around the colon separator', () => {
      // The format "13:00" with non-breaking space prefix/suffix gets trimmed → valid
      const result = getTriggerTime('\u00A013:00\u00A0');
      expect(result).not.toBeNull();
      expect(result!.getHours()).toBe(13);
    });
  });
});
