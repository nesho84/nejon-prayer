import { gatherConsentAndInitialize, showPrivacyOptions } from '@/services/adsService';
import { selectBannerVisible, useAdsStore } from '@/store/adsStore';

jest.mock('@/services/adsService', () => ({ gatherConsentAndInitialize: jest.fn(), showPrivacyOptions: jest.fn() }));

const mockGatherConsentAndInitialize = gatherConsentAndInitialize as jest.Mock;
const mockShowPrivacyOptions = showPrivacyOptions as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  useAdsStore.setState({
    canRequestAds: false,
    privacyOptionsRequired: false,
    bannerLoaded: false,
    bannerDismissed: false,
    bannerDismissedAt: null,
  });
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

  it('records when the banner was dismissed', () => {
    jest.spyOn(Date, 'now').mockReturnValueOnce(1_000_000);

    useAdsStore.getState().dismissBanner();

    expect(useAdsStore.getState().bannerDismissedAt).toBe(1_000_000);
  });

  it('restoreBanner ends the dismissal and resets the loaded latch for the fresh view', () => {
    useAdsStore.getState().markBannerLoaded();
    useAdsStore.getState().dismissBanner();

    useAdsStore.getState().restoreBanner();

    expect(useAdsStore.getState().bannerDismissed).toBe(false);
    expect(useAdsStore.getState().bannerDismissedAt).toBeNull();
    expect(useAdsStore.getState().bannerLoaded).toBe(false);
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
    mockGatherConsentAndInitialize.mockResolvedValue({ canRequestAds: true, privacyOptionsRequired: false });

    await useAdsStore.getState().initializeAds();

    expect(useAdsStore.getState().canRequestAds).toBe(true);
  });

  it('stores whether Google requires the privacy options entry point', async () => {
    mockGatherConsentAndInitialize.mockResolvedValue({ canRequestAds: true, privacyOptionsRequired: true });

    await useAdsStore.getState().initializeAds();

    expect(useAdsStore.getState().privacyOptionsRequired).toBe(true);
  });

  it('leaves canRequestAds false when the service reports no consent', async () => {
    mockGatherConsentAndInitialize.mockResolvedValue({ canRequestAds: false, privacyOptionsRequired: false });

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
    mockGatherConsentAndInitialize.mockResolvedValue({ canRequestAds: true, privacyOptionsRequired: false });
    await useAdsStore.getState().initializeAds();
    expect(useAdsStore.getState().canRequestAds).toBe(true);

    mockGatherConsentAndInitialize.mockResolvedValue({ canRequestAds: false, privacyOptionsRequired: false });
    await useAdsStore.getState().initializeAds();
    expect(useAdsStore.getState().canRequestAds).toBe(false);
  });
});

describe('adsStore — openPrivacyOptions', () => {
  it('turns ads off at once when the user withdraws consent', async () => {
    useAdsStore.setState({ canRequestAds: true, privacyOptionsRequired: true });
    mockShowPrivacyOptions.mockResolvedValue({ canRequestAds: false, privacyOptionsRequired: true });

    await useAdsStore.getState().openPrivacyOptions();

    expect(useAdsStore.getState().canRequestAds).toBe(false);
    expect(useAdsStore.getState().privacyOptionsRequired).toBe(true);
  });

  it('turns ads on when the user grants consent', async () => {
    useAdsStore.setState({ canRequestAds: false, privacyOptionsRequired: true });
    mockShowPrivacyOptions.mockResolvedValue({ canRequestAds: true, privacyOptionsRequired: true });

    await useAdsStore.getState().openPrivacyOptions();

    expect(useAdsStore.getState().canRequestAds).toBe(true);
  });

  it('propagates a failure and leaves consent state untouched', async () => {
    useAdsStore.setState({ canRequestAds: true, privacyOptionsRequired: true });
    mockShowPrivacyOptions.mockRejectedValue(new Error('form unavailable'));

    await expect(useAdsStore.getState().openPrivacyOptions()).rejects.toThrow('form unavailable');

    expect(useAdsStore.getState().canRequestAds).toBe(true);
  });
});
