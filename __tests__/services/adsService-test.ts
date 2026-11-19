import { gatherConsentAndInitialize, showPrivacyOptions } from '@/services/adsService';
import mobileAds, { AdsConsent } from 'react-native-google-mobile-ads';

const mockInitialize = jest.fn();

jest.mock('react-native-google-mobile-ads', () => ({
  __esModule: true,
  default: jest.fn(() => ({ initialize: mockInitialize })),
  AdsConsent: { gatherConsent: jest.fn(), getConsentInfo: jest.fn(), showPrivacyOptionsForm: jest.fn() },
  AdsConsentPrivacyOptionsRequirementStatus: {
    UNKNOWN: 'UNKNOWN',
    REQUIRED: 'REQUIRED',
    NOT_REQUIRED: 'NOT_REQUIRED',
  },
}));

const mockGatherConsent = AdsConsent.gatherConsent as jest.Mock;
const mockGetConsentInfo = AdsConsent.getConsentInfo as jest.Mock;
const mockShowPrivacyOptionsForm = AdsConsent.showPrivacyOptionsForm as jest.Mock;
const mockMobileAds = mobileAds as unknown as jest.Mock;

// getConsentInfo() result with sensible defaults
function consentInfo(canRequestAds: boolean, privacyOptionsRequirementStatus = 'NOT_REQUIRED') {
  return { canRequestAds, privacyOptionsRequirementStatus };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  mockGatherConsent.mockResolvedValue(undefined);
  mockGetConsentInfo.mockResolvedValue(consentInfo(true));
  mockShowPrivacyOptionsForm.mockResolvedValue(undefined);
  mockInitialize.mockResolvedValue(undefined);
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('gatherConsentAndInitialize — consent granted', () => {
  it('initializes the SDK and reports ads allowed', async () => {
    await expect(gatherConsentAndInitialize()).resolves.toEqual({
      canRequestAds: true,
      privacyOptionsRequired: false,
    });

    expect(mockGatherConsent).toHaveBeenCalledTimes(1);
    expect(mockGetConsentInfo).toHaveBeenCalledTimes(1);
    expect(mockInitialize).toHaveBeenCalledTimes(1);
  });

  it('gathers consent BEFORE initializing — ads can preload on initialize()', async () => {
    const order: string[] = [];
    mockGatherConsent.mockImplementation(async () => void order.push('gatherConsent'));
    mockInitialize.mockImplementation(async () => void order.push('initialize'));

    await gatherConsentAndInitialize();

    expect(order).toEqual(['gatherConsent', 'initialize']);
  });
});

describe('gatherConsentAndInitialize — consent withheld', () => {
  it('reports ads disallowed and never initializes the SDK', async () => {
    mockGetConsentInfo.mockResolvedValue(consentInfo(false));

    await expect(gatherConsentAndInitialize()).resolves.toEqual({
      canRequestAds: false,
      privacyOptionsRequired: false,
    });

    expect(mockInitialize).not.toHaveBeenCalled();
    expect(mockMobileAds).not.toHaveBeenCalled();
  });
});

describe('gatherConsentAndInitialize — privacy options requirement', () => {
  it('reports the entry point as required when UMP says REQUIRED', async () => {
    mockGetConsentInfo.mockResolvedValue(consentInfo(true, 'REQUIRED'));

    await expect(gatherConsentAndInitialize()).resolves.toEqual({
      canRequestAds: true,
      privacyOptionsRequired: true,
    });
  });

  it('still reports it required when ads are disallowed — the user must be able to change their mind', async () => {
    mockGetConsentInfo.mockResolvedValue(consentInfo(false, 'REQUIRED'));

    await expect(gatherConsentAndInitialize()).resolves.toEqual({
      canRequestAds: false,
      privacyOptionsRequired: true,
    });
  });

  it('treats UNKNOWN as not required', async () => {
    mockGetConsentInfo.mockResolvedValue(consentInfo(true, 'UNKNOWN'));

    await expect(gatherConsentAndInitialize()).resolves.toMatchObject({ privacyOptionsRequired: false });
  });
});

describe('gatherConsentAndInitialize — gatherConsent throws', () => {
  it('warns but still reads the previous session status and initializes', async () => {
    mockGatherConsent.mockRejectedValue(new Error('no form(s) configured'));

    await expect(gatherConsentAndInitialize()).resolves.toMatchObject({ canRequestAds: true });

    expect(console.warn).toHaveBeenCalled();
    expect(mockGetConsentInfo).toHaveBeenCalledTimes(1);
    expect(mockInitialize).toHaveBeenCalledTimes(1);
  });

  it('still reports ads disallowed when the previous session withheld consent', async () => {
    mockGatherConsent.mockRejectedValue(new Error('no form(s) configured'));
    mockGetConsentInfo.mockResolvedValue(consentInfo(false));

    await expect(gatherConsentAndInitialize()).resolves.toMatchObject({ canRequestAds: false });

    expect(mockInitialize).not.toHaveBeenCalled();
  });

  it('propagates a getConsentInfo failure to the caller', async () => {
    mockGetConsentInfo.mockRejectedValue(new Error('consent info unavailable'));

    await expect(gatherConsentAndInitialize()).rejects.toThrow('consent info unavailable');

    expect(mockInitialize).not.toHaveBeenCalled();
  });
});

describe('showPrivacyOptions', () => {
  it('shows the form, then re-reads consent', async () => {
    const order: string[] = [];
    mockShowPrivacyOptionsForm.mockImplementation(async () => void order.push('form'));
    mockGetConsentInfo.mockImplementation(async () => {
      order.push('consentInfo');
      return consentInfo(true, 'REQUIRED');
    });

    await expect(showPrivacyOptions()).resolves.toEqual({ canRequestAds: true, privacyOptionsRequired: true });

    expect(order).toEqual(['form', 'consentInfo']);
  });

  it('initializes the SDK when the user grants consent', async () => {
    mockGetConsentInfo.mockResolvedValue(consentInfo(true, 'REQUIRED'));

    await showPrivacyOptions();

    expect(mockInitialize).toHaveBeenCalledTimes(1);
  });

  it('reports ads disallowed and skips initialization when the user withdraws consent', async () => {
    mockGetConsentInfo.mockResolvedValue(consentInfo(false, 'REQUIRED'));

    await expect(showPrivacyOptions()).resolves.toEqual({ canRequestAds: false, privacyOptionsRequired: true });

    expect(mockInitialize).not.toHaveBeenCalled();
  });

  it('propagates a form failure without touching consent', async () => {
    mockShowPrivacyOptionsForm.mockRejectedValue(new Error('form unavailable'));

    await expect(showPrivacyOptions()).rejects.toThrow('form unavailable');

    expect(mockGetConsentInfo).not.toHaveBeenCalled();
  });
});
