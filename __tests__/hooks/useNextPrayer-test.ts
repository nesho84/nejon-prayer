jest.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

jest.mock('@react-navigation/native', () => ({
  useIsFocused: jest.fn(),
}));

import useNextPrayer from '@/hooks/useNextPrayer';
import { PrayerTimes } from '@/types/prayer.types';
import { useIsFocused } from '@react-navigation/native';
import { act, renderHook } from '@testing-library/react-native';

const mockIsFocused = useIsFocused as jest.Mock;

// Prayer times where (in order): Imsak 04:30, Fajr 04:50, Sunrise 06:20,
// Dhuhr 12:30, Asr 15:45, Maghrib 18:20, Isha 19:45
const PRAYER_TIMES: PrayerTimes = {
  Imsak: '04:30',
  Fajr: '04:50',
  Sunrise: '06:20',
  Dhuhr: '12:30',
  Asr: '15:45',
  Maghrib: '18:20',
  Isha: '19:45',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockIsFocused.mockReturnValue(true);
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('useNextPrayer — null prayer times', () => {
  it('returns all nulls when prayerTimes is null', () => {
    const { result } = renderHook(() => useNextPrayer(null));
    expect(result.current.nextPrayerName).toBeNull();
    expect(result.current.currentPrayerName).toBeNull();
    expect(result.current.prayerCountdown).toBeNull();
    expect(result.current.remainingSeconds).toBeNull();
    expect(result.current.prevPrayer).toBeNull();
    expect(result.current.afterNextPrayer).toBeNull();
  });
});

describe('useNextPrayer — not focused', () => {
  it('returns null countdown when screen is not focused', () => {
    mockIsFocused.mockReturnValue(false);
    jest.useFakeTimers();
    const { result } = renderHook(() => useNextPrayer(PRAYER_TIMES));
    act(() => { jest.advanceTimersByTime(0); });
    expect(result.current.nextPrayerName).toBeNull();
    expect(result.current.prayerCountdown).toBeNull();
  });
});

describe('useNextPrayer — with prayer times and fixed clock', () => {
  it('sets nextPrayerName to Dhuhr when current time is 12:00', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-22T12:00:00'));

    const { result } = renderHook(() => useNextPrayer(PRAYER_TIMES));
    act(() => { jest.advanceTimersByTime(0); });

    expect(result.current.nextPrayerName).toBe('Dhuhr');
  });

  it('sets nextPrayerName to Asr when current time is 13:00', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-22T13:00:00'));

    const { result } = renderHook(() => useNextPrayer(PRAYER_TIMES));
    act(() => { jest.advanceTimersByTime(0); });

    expect(result.current.nextPrayerName).toBe('Asr');
  });

  it('wraps to Fajr when all prayers have passed (after Isha)', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-22T22:00:00'));

    const { result } = renderHook(() => useNextPrayer(PRAYER_TIMES));
    act(() => { jest.advanceTimersByTime(0); });

    expect(result.current.nextPrayerName).toBe('Fajr');
  });

  it('countdown decrements after 1 second tick', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-22T12:00:00'));

    const { result } = renderHook(() => useNextPrayer(PRAYER_TIMES));
    act(() => { jest.advanceTimersByTime(0); });
    const initialSeconds = result.current.remainingSeconds!;

    act(() => { jest.advanceTimersByTime(1000); });
    expect(result.current.remainingSeconds).toBe(initialSeconds - 1);
  });

  it('totalSeconds is positive and >= remainingSeconds', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-22T12:00:00'));

    const { result } = renderHook(() => useNextPrayer(PRAYER_TIMES));
    act(() => { jest.advanceTimersByTime(0); });

    expect(result.current.totalSeconds).toBeGreaterThan(0);
    expect(result.current.totalSeconds).toBeGreaterThanOrEqual(result.current.remainingSeconds!);
  });
});

