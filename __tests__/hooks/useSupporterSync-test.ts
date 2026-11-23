import { useSupporterSync } from '@/hooks/useSupporterSync';
import { addPurchaseListeners } from '@/services/billingService';
import { useSupporterStore } from '@/store/supporterStore';
import { act, renderHook } from '@testing-library/react-native';
import { AppState, Platform } from 'react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));

jest.mock('@/services/billingService', () => ({ addPurchaseListeners: jest.fn() }));

jest.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  Platform: { OS: 'android', select: (obj: Record<string, unknown>) => obj.android ?? obj.default, Version: 0 },
}));

const mockAddPurchaseListeners = addPurchaseListeners as jest.Mock;
const mockAddEventListener = AppState.addEventListener as jest.Mock;

let mockSyncPurchases: jest.Mock;
let mockRemoveListeners: jest.Mock;
let mockRemoveAppState: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  (Platform as { OS: string }).OS = 'android';
  mockSyncPurchases = jest.fn().mockResolvedValue(true);
  mockRemoveListeners = jest.fn();
  mockRemoveAppState = jest.fn();
  mockAddPurchaseListeners.mockReturnValue(mockRemoveListeners);
  mockAddEventListener.mockReturnValue({ remove: mockRemoveAppState });
  useSupporterStore.setState({ isReady: true, syncPurchases: mockSyncPurchases });
});

describe('useSupporterSync — mount', () => {
  it('listens for purchases app-wide with the store handlers and syncs once', () => {
    renderHook(() => useSupporterSync());
    const { handlePurchase, handlePurchaseError } = useSupporterStore.getState();
    expect(mockAddPurchaseListeners).toHaveBeenCalledWith(handlePurchase, handlePurchaseError);
    expect(mockSyncPurchases).toHaveBeenCalledTimes(1);
  });

  it('waits until the store has loaded', () => {
    useSupporterStore.setState({ isReady: false });
    renderHook(() => useSupporterSync());
    expect(mockAddPurchaseListeners).not.toHaveBeenCalled();

    act(() => useSupporterStore.setState({ isReady: true }));
    expect(mockAddPurchaseListeners).toHaveBeenCalledTimes(1);
    expect(mockSyncPurchases).toHaveBeenCalledTimes(1);
  });

  it('does nothing on iOS', () => {
    (Platform as { OS: string }).OS = 'ios';
    renderHook(() => useSupporterSync());
    expect(mockAddPurchaseListeners).not.toHaveBeenCalled();
    expect(mockSyncPurchases).not.toHaveBeenCalled();
    expect(mockAddEventListener).not.toHaveBeenCalled();
  });
});

describe('useSupporterSync — AppState transitions', () => {
  it('syncs again when the app returns to the foreground', () => {
    renderHook(() => useSupporterSync());
    const changeCallback = mockAddEventListener.mock.calls[0][1];
    mockSyncPurchases.mockClear();

    changeCallback('background');
    changeCallback('active');
    expect(mockSyncPurchases).toHaveBeenCalledTimes(1);
  });

  it('does not sync when going to the background', () => {
    renderHook(() => useSupporterSync());
    const changeCallback = mockAddEventListener.mock.calls[0][1];
    mockSyncPurchases.mockClear();

    changeCallback('background');
    expect(mockSyncPurchases).not.toHaveBeenCalled();
  });
});

describe('useSupporterSync — cleanup', () => {
  it('removes the purchase listeners and the AppState subscription on unmount', () => {
    const { unmount } = renderHook(() => useSupporterSync());
    unmount();
    expect(mockRemoveListeners).toHaveBeenCalled();
    expect(mockRemoveAppState).toHaveBeenCalled();
  });
});
