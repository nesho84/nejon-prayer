import { gatherConsentAndInitialize } from '@/services/adsService';
import mobileAds, { AdsConsent } from 'react-native-google-mobile-ads';

const mockInitialize = jest.fn();

jest.mock('react-native-google-mobile-ads', () => ({
  __esModule: true,
  default: jest.fn(() => ({ initialize: mockInitialize })),
  AdsConsent: { gatherConsent: jest.fn(), getConsentInfo: jest.fn() },
}));

const mockGatherConsent = AdsConsent.gatherConsent as jest.Mock;
const mockGetConsentInfo = AdsConsent.getConsentInfo as jest.Mock;
const mockMobileAds = mobileAds as unknown as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  mockGatherConsent.mockResolvedValue(undefined);
  mockGetConsentInfo.mockResolvedValue({ canRequestAds: true });
  mockInitialize.mockResolvedValue(undefined);
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('gatherConsentAndInitialize — consent granted', () => {
  it('initializes the SDK and returns true', async () => {
    await expect(gatherConsentAndInitialize()).resolves.toBe(true);

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
  it('returns false and never initializes the SDK', async () => {
    mockGetConsentInfo.mockResolvedValue({ canRequestAds: false });

    await expect(gatherConsentAndInitialize()).resolves.toBe(false);

    expect(mockInitialize).not.toHaveBeenCalled();
    expect(mockMobileAds).not.toHaveBeenCalled();
  });
});

describe('gatherConsentAndInitialize — gatherConsent throws', () => {
  it('warns but still reads the previous session status and initializes', async () => {
    mockGatherConsent.mockRejectedValue(new Error('no form(s) configured'));

    await expect(gatherConsentAndInitialize()).resolves.toBe(true);

    expect(console.warn).toHaveBeenCalled();
    expect(mockGetConsentInfo).toHaveBeenCalledTimes(1);
    expect(mockInitialize).toHaveBeenCalledTimes(1);
  });

  it('still returns false when the previous session withheld consent', async () => {
    mockGatherConsent.mockRejectedValue(new Error('no form(s) configured'));
    mockGetConsentInfo.mockResolvedValue({ canRequestAds: false });

    await expect(gatherConsentAndInitialize()).resolves.toBe(false);

    expect(mockInitialize).not.toHaveBeenCalled();
  });

  it('propagates a getConsentInfo failure to the caller', async () => {
    mockGetConsentInfo.mockRejectedValue(new Error('consent info unavailable'));

    await expect(gatherConsentAndInitialize()).rejects.toThrow('consent info unavailable');

    expect(mockInitialize).not.toHaveBeenCalled();
  });
});
