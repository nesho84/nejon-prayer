import { useAdsSync } from '@/hooks/useAdsSync';
import { useAdsStore } from '@/store/adsStore';
import { useSupporterStore } from '@/store/supporterStore';
import { act, renderHook } from '@testing-library/react-native';
import { Platform } from 'react-native';

jest.mock('@/services/adsService', () => ({ gatherConsentAndInitialize: jest.fn() }));
jest.mock('@/services/billingService', () => ({}));
jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));

const mockInitializeAds = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (Platform as { OS: string }).OS = 'android';
  mockInitializeAds.mockResolvedValue(undefined);
  useAdsStore.setState({ canRequestAds: false, initializeAds: mockInitializeAds });
  useSupporterStore.setState({ isReady: true, isSupporter: false, entitlementChecked: false });
});

describe('useAdsSync — Android', () => {
  it('waits for the supporter check, then gathers consent once', () => {
    renderHook(() => useAdsSync());
    expect(mockInitializeAds).not.toHaveBeenCalled();

    act(() => useSupporterStore.setState({ entitlementChecked: true }));
    expect(mockInitializeAds).toHaveBeenCalledTimes(1);
  });

  it('never runs for a supporter remembered on this phone', () => {
    useSupporterStore.setState({ isSupporter: true, entitlementChecked: true });
    renderHook(() => useAdsSync());
    expect(mockInitializeAds).not.toHaveBeenCalled();
  });

  it('never runs when the check finds a supporter (reinstall)', () => {
    renderHook(() => useAdsSync());
    act(() => useSupporterStore.setState({ isSupporter: true, entitlementChecked: true }));
    expect(mockInitializeAds).not.toHaveBeenCalled();
  });

  it('starts when the check removes a refunded unlock', () => {
    useSupporterStore.setState({ isSupporter: true });
    renderHook(() => useAdsSync());
    act(() => useSupporterStore.setState({ isSupporter: false, entitlementChecked: true }));
    expect(mockInitializeAds).toHaveBeenCalledTimes(1);
  });

  it('waits until the supporter store has loaded', () => {
    useSupporterStore.setState({ isReady: false, entitlementChecked: true });
    renderHook(() => useAdsSync());
    expect(mockInitializeAds).not.toHaveBeenCalled();

    act(() => useSupporterStore.setState({ isReady: true }));
    expect(mockInitializeAds).toHaveBeenCalledTimes(1);
  });

  it('runs once per launch — later changes and re-renders do not re-run it', () => {
    useSupporterStore.setState({ entitlementChecked: true });
    const { rerender } = renderHook(() => useAdsSync());
    rerender(undefined);
    act(() => useSupporterStore.setState({ isSupporter: true }));
    act(() => useSupporterStore.setState({ isSupporter: false }));
    expect(mockInitializeAds).toHaveBeenCalledTimes(1);
  });
});

describe('useAdsSync — iOS', () => {
  it('gathers consent right away — no Play check on iOS', () => {
    (Platform as { OS: string }).OS = 'ios';
    renderHook(() => useAdsSync());
    expect(mockInitializeAds).toHaveBeenCalledTimes(1);
  });
});
