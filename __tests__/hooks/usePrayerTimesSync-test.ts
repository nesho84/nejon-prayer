import { usePrayerTimesSync } from '@/hooks/usePrayerTimesSync';
import { usePrayersStore } from '@/store/prayersStore';
import { toDateKey } from '@/utils/datetime';
import { renderHook } from '@testing-library/react-native';
import { AppState } from 'react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));

jest.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  Platform: { OS: 'ios', select: (obj: Record<string, unknown>) => obj.ios ?? obj.default, Version: 0 },
}));

jest.mock('@/store/prayersStore', () => ({
  usePrayersStore: jest.fn(),
}));

jest.mock('@/utils/datetime', () => ({
  toDateKey: jest.fn(),
}));

const mockAddEventListener = AppState.addEventListener as jest.Mock;
const mockToDateKey = toDateKey as jest.Mock;

let mockLoadPrayerTimes: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockLoadPrayerTimes = jest.fn();
  (usePrayersStore as unknown as jest.Mock).mockImplementation((selector: Function) =>
    selector({ loadPrayerTimes: mockLoadPrayerTimes })
  );
  mockAddEventListener.mockReturnValue({ remove: jest.fn() });
  mockToDateKey.mockReturnValue('2026-05-22');
});

describe('usePrayerTimesSync — AppState transitions', () => {
  it('calls loadPrayerTimes when coming to foreground on a new day', () => {
    renderHook(() => usePrayerTimesSync());
    const changeCallback = mockAddEventListener.mock.calls[0][1];

    changeCallback('background');              // appStateRef → 'background'
    mockToDateKey.mockReturnValue('2026-05-23'); // day rolled over
    changeCallback('active');                  // foreground on new day

    expect(mockLoadPrayerTimes).toHaveBeenCalledTimes(1);
  });

  it('does not call loadPrayerTimes when coming to foreground on the same day', () => {
    renderHook(() => usePrayerTimesSync());
    const changeCallback = mockAddEventListener.mock.calls[0][1];

    changeCallback('background');
    changeCallback('active'); // same date key

    expect(mockLoadPrayerTimes).not.toHaveBeenCalled();
  });

  it('does not call loadPrayerTimes when AppState stays active', () => {
    renderHook(() => usePrayerTimesSync());
    const changeCallback = mockAddEventListener.mock.calls[0][1];

    changeCallback('active');
    expect(mockLoadPrayerTimes).not.toHaveBeenCalled();
  });
});

describe('usePrayerTimesSync — interval', () => {
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('calls loadPrayerTimes when interval fires on a new day', () => {
    jest.useFakeTimers();
    renderHook(() => usePrayerTimesSync());
    mockToDateKey.mockReturnValue('2026-05-23');
    jest.advanceTimersByTime(60000);
    expect(mockLoadPrayerTimes).toHaveBeenCalledTimes(1);
  });

  it('does not call loadPrayerTimes when interval fires on the same day', () => {
    jest.useFakeTimers();
    renderHook(() => usePrayerTimesSync());
    jest.advanceTimersByTime(60000);
    expect(mockLoadPrayerTimes).not.toHaveBeenCalled();
  });
});

describe('usePrayerTimesSync — cleanup', () => {
  it('removes the AppState subscription on unmount', () => {
    const mockRemove = jest.fn();
    mockAddEventListener.mockReturnValue({ remove: mockRemove });
    const { unmount } = renderHook(() => usePrayerTimesSync());
    unmount();
    expect(mockRemove).toHaveBeenCalled();
  });
});
