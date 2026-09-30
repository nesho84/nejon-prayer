import { canRequestStoreReview, requestStoreReview } from '@/services/storeReviewService';
import * as StoreReview from 'expo-store-review';

jest.mock('expo-store-review', () => ({
  hasAction: jest.fn(),
  requestReview: jest.fn(),
}));

const mockHasAction = StoreReview.hasAction as jest.Mock;
const mockRequestReview = StoreReview.requestReview as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  mockHasAction.mockResolvedValue(true);
  mockRequestReview.mockResolvedValue(undefined);
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('canRequestStoreReview', () => {
  it('passes through hasAction() true', async () => {
    await expect(canRequestStoreReview()).resolves.toBe(true);
  });

  it('passes through hasAction() false', async () => {
    mockHasAction.mockResolvedValue(false);

    await expect(canRequestStoreReview()).resolves.toBe(false);
  });
});

describe('requestStoreReview', () => {
  it('requests the native review dialog once', async () => {
    await requestStoreReview();

    expect(mockRequestReview).toHaveBeenCalledTimes(1);
  });

  it('warns instead of throwing when the request rejects (e.g. not installed from the store)', async () => {
    mockRequestReview.mockRejectedValue(new Error('ERR_STORE_REVIEW_FAILED'));

    await expect(requestStoreReview()).resolves.toBeUndefined();

    expect(console.warn).toHaveBeenCalled();
  });
});
