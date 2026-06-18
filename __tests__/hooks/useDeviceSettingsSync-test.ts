import { useDeviceSettingsSync } from '@/hooks/useDeviceSettingsSync';
import { useDeviceSettingsStore } from '@/store/deviceSettingsStore';
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

jest.mock('@/store/deviceSettingsStore', () => ({
  useDeviceSettingsStore: jest.fn(),
}));

const mockAddEventListener = AppState.addEventListener as jest.Mock;

let mockSyncDeviceSettings: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockSyncDeviceSettings = jest.fn();
  (useDeviceSettingsStore as unknown as jest.Mock).mockImplementation((selector: Function) =>
    selector({ syncDeviceSettings: mockSyncDeviceSettings })
  );
  mockAddEventListener.mockReturnValue({ remove: jest.fn() });
});

describe('useDeviceSettingsSync — mount', () => {
  it('calls syncDeviceSettings once on mount', () => {
    renderHook(() => useDeviceSettingsSync());
    expect(mockSyncDeviceSettings).toHaveBeenCalledTimes(1);
  });
});

describe('useDeviceSettingsSync — AppState transitions', () => {
  it('calls syncDeviceSettings when coming to foreground from background', () => {
    renderHook(() => useDeviceSettingsSync());
    const changeCallback = mockAddEventListener.mock.calls[0][1];
    mockSyncDeviceSettings.mockClear();

    changeCallback('background'); // appStateRef → 'background'
    changeCallback('active');     // background → active: should sync
    expect(mockSyncDeviceSettings).toHaveBeenCalledTimes(1);
  });

  it('calls syncDeviceSettings when coming to foreground from inactive', () => {
    renderHook(() => useDeviceSettingsSync());
    const changeCallback = mockAddEventListener.mock.calls[0][1];
    mockSyncDeviceSettings.mockClear();

    changeCallback('inactive');
    changeCallback('active');
    expect(mockSyncDeviceSettings).toHaveBeenCalledTimes(1);
  });

  it('does not call syncDeviceSettings when AppState stays active', () => {
    renderHook(() => useDeviceSettingsSync());
    const changeCallback = mockAddEventListener.mock.calls[0][1];
    mockSyncDeviceSettings.mockClear();

    changeCallback('active');
    expect(mockSyncDeviceSettings).not.toHaveBeenCalled();
  });
});

describe('useDeviceSettingsSync — cleanup', () => {
  it('removes the AppState subscription on unmount', () => {
    const mockRemove = jest.fn();
    mockAddEventListener.mockReturnValue({ remove: mockRemove });
    const { unmount } = renderHook(() => useDeviceSettingsSync());
    unmount();
    expect(mockRemove).toHaveBeenCalled();
  });
});
