import { useLocationSync } from '@/hooks/useLocationSync';
import { useLocationStore } from '@/store/locationStore';
import { renderHook } from '@testing-library/react-native';
import { AppState } from 'react-native';

jest.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  Platform: { OS: 'ios', select: (obj: Record<string, unknown>) => obj.ios ?? obj.default, Version: 0 },
}));

jest.mock('@/store/locationStore', () => ({
  useLocationStore: { getState: jest.fn() },
}));

const mockAddEventListener = AppState.addEventListener as jest.Mock;

let mockCheckLocationChange: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockCheckLocationChange = jest.fn();
  (useLocationStore.getState as jest.Mock).mockReturnValue({
    checkLocationChange: mockCheckLocationChange,
  });
  mockAddEventListener.mockReturnValue({ remove: jest.fn() });
});

describe('useLocationSync — mount', () => {
  it('checks for a location change once on mount', () => {
    renderHook(() => useLocationSync());
    expect(mockCheckLocationChange).toHaveBeenCalledTimes(1);
  });
});

describe('useLocationSync — AppState transitions', () => {
  it('re-checks when coming to foreground from background', () => {
    renderHook(() => useLocationSync());
    const changeCallback = mockAddEventListener.mock.calls[0][1];
    mockCheckLocationChange.mockClear();

    changeCallback('background'); // appStateRef → 'background'
    changeCallback('active');     // background → active: should check
    expect(mockCheckLocationChange).toHaveBeenCalledTimes(1);
  });

  it('re-checks when coming to foreground from inactive', () => {
    renderHook(() => useLocationSync());
    const changeCallback = mockAddEventListener.mock.calls[0][1];
    mockCheckLocationChange.mockClear();

    changeCallback('inactive');
    changeCallback('active');
    expect(mockCheckLocationChange).toHaveBeenCalledTimes(1);
  });

  it('does not re-check when AppState stays active', () => {
    renderHook(() => useLocationSync());
    const changeCallback = mockAddEventListener.mock.calls[0][1];
    mockCheckLocationChange.mockClear();

    changeCallback('active');
    expect(mockCheckLocationChange).not.toHaveBeenCalled();
  });
});

describe('useLocationSync — cleanup', () => {
  it('removes the AppState subscription on unmount', () => {
    const mockRemove = jest.fn();
    mockAddEventListener.mockReturnValue({ remove: mockRemove });
    const { unmount } = renderHook(() => useLocationSync());
    unmount();
    expect(mockRemove).toHaveBeenCalled();
  });
});
