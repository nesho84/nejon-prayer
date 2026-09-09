import { gatherConsentAndInitialize } from '@/services/adsService';
import { selectBannerVisible, useAdsStore } from '@/store/adsStore';

jest.mock('@/services/adsService', () => ({ gatherConsentAndInitialize: jest.fn() }));

const mockGatherConsentAndInitialize = gatherConsentAndInitialize as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  useAdsStore.setState({ canRequestAds: false, bannerLoaded: false, bannerDismissed: false });
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('adsStore — initial state', () => {
  it('starts with canRequestAds false so ads are gated until consent resolves', () => {
    expect(useAdsStore.getState().canRequestAds).toBe(false);
  });

  it('starts with the banner neither loaded nor dismissed', () => {
    expect(useAdsStore.getState().bannerLoaded).toBe(false);
    expect(useAdsStore.getState().bannerDismissed).toBe(false);
  });
});

describe('adsStore — banner state', () => {
  it('latches bannerLoaded one-way so a failed refresh cannot collapse a visible ad', () => {
    useAdsStore.getState().markBannerLoaded();
    expect(useAdsStore.getState().bannerLoaded).toBe(true);

    useAdsStore.getState().markBannerLoaded();
    expect(useAdsStore.getState().bannerLoaded).toBe(true);
  });

  it('records a dismissal without touching bannerLoaded', () => {
    useAdsStore.getState().markBannerLoaded();

    useAdsStore.getState().dismissBanner();

    expect(useAdsStore.getState().bannerDismissed).toBe(true);
    expect(useAdsStore.getState().bannerLoaded).toBe(true);
  });
});

describe('adsStore — selectBannerVisible', () => {
  it('is true only once consent, load and no dismissal all hold', () => {
    useAdsStore.setState({ canRequestAds: true });
    expect(selectBannerVisible(useAdsStore.getState())).toBe(false);

    useAdsStore.getState().markBannerLoaded();

    expect(selectBannerVisible(useAdsStore.getState())).toBe(true);
  });

  it('is false without consent, even after the banner loaded', () => {
    useAdsStore.setState({ canRequestAds: false });
    useAdsStore.getState().markBannerLoaded();

    expect(selectBannerVisible(useAdsStore.getState())).toBe(false);
  });

  it('is false once dismissed', () => {
    useAdsStore.setState({ canRequestAds: true });
    useAdsStore.getState().markBannerLoaded();

    useAdsStore.getState().dismissBanner();

    expect(selectBannerVisible(useAdsStore.getState())).toBe(false);
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
