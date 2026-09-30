import { useStoreReviewSync } from '@/hooks/useStoreReviewSync';
import { useStoreReviewStore } from '@/store/storeReviewStore';
import { renderHook } from '@testing-library/react-native';
import { AppState } from 'react-native';

jest.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  Platform: { OS: 'ios', select: (obj: Record<string, unknown>) => obj.ios ?? obj.default, Version: 0 },
}));

jest.mock('@/store/storeReviewStore', () => ({
  useStoreReviewStore: { getState: jest.fn() },
}));

const mockAddEventListener = AppState.addEventListener as jest.Mock;

let mockRecordAppOpen: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockRecordAppOpen = jest.fn();
  (useStoreReviewStore.getState as jest.Mock).mockReturnValue({ recordAppOpen: mockRecordAppOpen });
  mockAddEventListener.mockReturnValue({ remove: jest.fn() });
});

describe('useStoreReviewSync — mount', () => {
  it('records an app open once on mount', () => {
    renderHook(() => useStoreReviewSync());

    expect(mockRecordAppOpen).toHaveBeenCalledTimes(1);
  });
});

describe('useStoreReviewSync — AppState transitions', () => {
  it('records an open when coming to foreground from background', () => {
    renderHook(() => useStoreReviewSync());
    const changeCallback = mockAddEventListener.mock.calls[0][1];
    mockRecordAppOpen.mockClear();

    changeCallback('background');
    changeCallback('active');

    expect(mockRecordAppOpen).toHaveBeenCalledTimes(1);
  });

  it('records an open when coming to foreground from inactive', () => {
    renderHook(() => useStoreReviewSync());
    const changeCallback = mockAddEventListener.mock.calls[0][1];
    mockRecordAppOpen.mockClear();

    changeCallback('inactive');
    changeCallback('active');

    expect(mockRecordAppOpen).toHaveBeenCalledTimes(1);
  });

  it('does not record when AppState stays active', () => {
    renderHook(() => useStoreReviewSync());
    const changeCallback = mockAddEventListener.mock.calls[0][1];
    mockRecordAppOpen.mockClear();

    changeCallback('active');

    expect(mockRecordAppOpen).not.toHaveBeenCalled();
  });
});

describe('useStoreReviewSync — cleanup', () => {
  it('removes the AppState subscription on unmount', () => {
    const mockRemove = jest.fn();
    mockAddEventListener.mockReturnValue({ remove: mockRemove });

    const { unmount } = renderHook(() => useStoreReviewSync());
    unmount();

    expect(mockRemove).toHaveBeenCalled();
  });
});
