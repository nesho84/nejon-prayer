import { useAdsSync } from '@/hooks/useAdsSync';
import { useAdsStore } from '@/store/adsStore';
import { renderHook } from '@testing-library/react-native';

jest.mock('@/services/adsService', () => ({ gatherConsentAndInitialize: jest.fn() }));

const mockInitializeAds = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockInitializeAds.mockResolvedValue(undefined);
  useAdsStore.setState({ canRequestAds: false, initializeAds: mockInitializeAds });
});

describe('useAdsSync', () => {
  it('kicks off consent gathering once on mount', () => {
    renderHook(() => useAdsSync());

    expect(mockInitializeAds).toHaveBeenCalledTimes(1);
  });

  it('does not re-run on re-render — consent is gathered once per launch', () => {
    const { rerender } = renderHook(() => useAdsSync());

    rerender(undefined);
    rerender(undefined);

    expect(mockInitializeAds).toHaveBeenCalledTimes(1);
  });
});
