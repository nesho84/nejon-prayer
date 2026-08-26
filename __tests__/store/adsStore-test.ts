import { gatherConsentAndInitialize } from '@/services/adsService';
import { useAdsStore } from '@/store/adsStore';

jest.mock('@/services/adsService', () => ({ gatherConsentAndInitialize: jest.fn() }));

const mockGatherConsentAndInitialize = gatherConsentAndInitialize as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  useAdsStore.setState({ canRequestAds: false });
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('adsStore — initial state', () => {
  it('starts with canRequestAds false so ads are gated until consent resolves', () => {
    expect(useAdsStore.getState().canRequestAds).toBe(false);
  });
});

describe('adsStore — initializeAds', () => {
  it('sets canRequestAds true when the service reports consent', async () => {
    mockGatherConsentAndInitialize.mockResolvedValue(true);

    await useAdsStore.getState().initializeAds();

    expect(useAdsStore.getState().canRequestAds).toBe(true);
  });

  it('leaves canRequestAds false when the service reports no consent', async () => {
    mockGatherConsentAndInitialize.mockResolvedValue(false);

    await useAdsStore.getState().initializeAds();

    expect(useAdsStore.getState().canRequestAds).toBe(false);
  });

  it('fails closed — a service rejection is logged and leaves ads disabled', async () => {
    mockGatherConsentAndInitialize.mockRejectedValue(new Error('consent info unavailable'));

    await expect(useAdsStore.getState().initializeAds()).resolves.toBeUndefined();

    expect(console.error).toHaveBeenCalled();
    expect(useAdsStore.getState().canRequestAds).toBe(false);
  });

  it('re-evaluates on every call rather than caching the previous result', async () => {
    mockGatherConsentAndInitialize.mockResolvedValue(true);
    await useAdsStore.getState().initializeAds();
    expect(useAdsStore.getState().canRequestAds).toBe(true);

    mockGatherConsentAndInitialize.mockResolvedValue(false);
    await useAdsStore.getState().initializeAds();
    expect(useAdsStore.getState().canRequestAds).toBe(false);
  });
});
