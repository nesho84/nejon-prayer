import { finishPurchase, getOwnedPurchases, getProducts, startPurchase } from '@/services/billingService';
import { useSupporterStore } from '@/store/supporterStore';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));

jest.mock('@/services/billingService', () => ({
  getProducts: jest.fn(),
  finishPurchase: jest.fn(),
  getOwnedPurchases: jest.fn(),
  startPurchase: jest.fn(),
}));

const mockGetProducts = getProducts as jest.Mock;
const mockFinishPurchase = finishPurchase as jest.Mock;
const mockGetOwnedPurchases = getOwnedPurchases as jest.Mock;
const mockStartPurchase = startPurchase as jest.Mock;

const INITIAL_STATE = {
  isSupporter: false,
  supporterSince: null,
  unlockPending: false,
  giftPending: false,
  lastGiftAt: null,
  lastKnownPrices: {},
  entitlementChecked: false,
  playStatus: 'loading' as const,
  productsFresh: false,
  purchasingId: null,
};

// A Play purchase with sensible defaults
function purchase(productId: string, overrides: Record<string, unknown> = {}): any {
  return {
    id: `order-${productId}`,
    productId,
    purchaseState: 'purchased',
    transactionDate: 1795000000000,
    purchaseToken: `token-${productId}`,
    isAcknowledgedAndroid: false,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  useSupporterStore.setState(INITIAL_STATE);
  mockFinishPurchase.mockResolvedValue(true);
});

describe('supporterStore — handlePurchase', () => {
  it('pending unlock does not unlock anything', async () => {
    await useSupporterStore.getState().handlePurchase(purchase('supporter_unlock', { purchaseState: 'pending' }));
    const state = useSupporterStore.getState();
    expect(state.isSupporter).toBe(false);
    expect(state.unlockPending).toBe(true);
    expect(mockFinishPurchase).not.toHaveBeenCalled();
  });

  it('pending gift is marked pending and not consumed', async () => {
    await useSupporterStore.getState().handlePurchase(purchase('gift_small', { purchaseState: 'pending' }));
    expect(useSupporterStore.getState().giftPending).toBe(true);
    expect(useSupporterStore.getState().lastGiftAt).toBeNull();
    expect(mockFinishPurchase).not.toHaveBeenCalled();
  });

  it('purchased unlock grants supporter with Play\'s date and acknowledges it', async () => {
    useSupporterStore.setState({ unlockPending: true, purchasingId: 'supporter_unlock' });
    const p = purchase('supporter_unlock');
    await useSupporterStore.getState().handlePurchase(p);
    const state = useSupporterStore.getState();
    expect(state.isSupporter).toBe(true);
    expect(state.supporterSince).toBe(1795000000000);
    expect(state.unlockPending).toBe(false);
    expect(state.purchasingId).toBeNull();
    expect(mockFinishPurchase).toHaveBeenCalledWith(p, false);
  });

  it('does not acknowledge an unlock twice', async () => {
    await useSupporterStore.getState().handlePurchase(purchase('supporter_unlock', { isAcknowledgedAndroid: true }));
    expect(useSupporterStore.getState().isSupporter).toBe(true);
    expect(mockFinishPurchase).not.toHaveBeenCalled();
  });

  it('purchased gift records the thank-you date and is consumed', async () => {
    useSupporterStore.setState({ giftPending: true });
    const p = purchase('gift_medium');
    await useSupporterStore.getState().handlePurchase(p);
    expect(useSupporterStore.getState().lastGiftAt).toBe(1795000000000);
    expect(useSupporterStore.getState().giftPending).toBe(false);
    expect(useSupporterStore.getState().isSupporter).toBe(false);
    expect(mockFinishPurchase).toHaveBeenCalledWith(p, true);
  });

  it('finishes a purchase only once when the listener and a sync see it together', async () => {
    let release!: () => void;
    mockFinishPurchase.mockReturnValue(new Promise((resolve) => { release = () => resolve(true); }));
    const p = purchase('gift_small');

    const first = useSupporterStore.getState().handlePurchase(p);
    const second = useSupporterStore.getState().handlePurchase(p);
    release();
    await Promise.all([first, second]);

    expect(mockFinishPurchase).toHaveBeenCalledTimes(1);
  });

  it('ignores unknown products and unknown states', async () => {
    await useSupporterStore.getState().handlePurchase(purchase('something_else'));
    await useSupporterStore.getState().handlePurchase(purchase('supporter_unlock', { purchaseState: 'unknown' }));
    expect(useSupporterStore.getState().isSupporter).toBe(false);
    expect(mockFinishPurchase).not.toHaveBeenCalled();
  });
});

describe('supporterStore — syncPurchases', () => {
  it('restores the unlock from Play (reinstall / new phone)', async () => {
    mockGetOwnedPurchases.mockResolvedValue({ purchases: [purchase('supporter_unlock', { isAcknowledgedAndroid: true })] });
    expect(await useSupporterStore.getState().syncPurchases()).toBe(true);
    expect(useSupporterStore.getState().isSupporter).toBe(true);
    expect(useSupporterStore.getState().entitlementChecked).toBe(true);
  });

  it('keeps the cached unlock when Play cannot be reached', async () => {
    useSupporterStore.setState({ isSupporter: true, supporterSince: 1 });
    mockGetOwnedPurchases.mockResolvedValue({ error: 'unavailable' });
    expect(await useSupporterStore.getState().syncPurchases()).toBe(false);
    expect(useSupporterStore.getState().isSupporter).toBe(true);
    expect(useSupporterStore.getState().entitlementChecked).toBe(true);
  });

  it('revokes the unlock when Play answers without it (refund)', async () => {
    useSupporterStore.setState({ isSupporter: true, supporterSince: 1, unlockPending: true });
    mockGetOwnedPurchases.mockResolvedValue({ purchases: [] });
    await useSupporterStore.getState().syncPurchases();
    const state = useSupporterStore.getState();
    expect(state.isSupporter).toBe(false);
    expect(state.supporterSince).toBeNull();
    expect(state.unlockPending).toBe(false);
  });

  it('clears a gift pending flag once Play no longer reports it', async () => {
    useSupporterStore.setState({ giftPending: true });
    mockGetOwnedPurchases.mockResolvedValue({ purchases: [] });
    await useSupporterStore.getState().syncPurchases();
    expect(useSupporterStore.getState().giftPending).toBe(false);
  });

  it('consumes gifts left unfinished and acknowledges an unfinished unlock', async () => {
    const gift = purchase('gift_large');
    const unlock = purchase('supporter_unlock');
    mockGetOwnedPurchases.mockResolvedValue({ purchases: [gift, unlock] });
    await useSupporterStore.getState().syncPurchases();
    expect(mockFinishPurchase).toHaveBeenCalledWith(gift, true);
    expect(mockFinishPurchase).toHaveBeenCalledWith(unlock, false);
  });

  it('shares one Play query between overlapping syncs', async () => {
    mockGetOwnedPurchases.mockResolvedValue({ purchases: [] });
    await Promise.all([
      useSupporterStore.getState().syncPurchases(),
      useSupporterStore.getState().syncPurchases(),
    ]);
    expect(mockGetOwnedPurchases).toHaveBeenCalledTimes(1);

    await useSupporterStore.getState().syncPurchases();
    expect(mockGetOwnedPurchases).toHaveBeenCalledTimes(2);
  });
});

describe('supporterStore — loadProducts', () => {
  it('stores fresh prices and allows buying', async () => {
    mockGetProducts.mockResolvedValue({
      products: [
        { id: 'supporter_unlock', displayPrice: '€5.99' },
        { id: 'gift_small', displayPrice: '€1.99' },
      ],
    });
    await useSupporterStore.getState().loadProducts();
    expect(mockGetProducts).toHaveBeenCalledWith(['supporter_unlock', 'gift_small', 'gift_medium', 'gift_large']);
    const state = useSupporterStore.getState();
    expect(state.playStatus).toBe('ready');
    expect(state.productsFresh).toBe(true);
    expect(state.lastKnownPrices).toEqual({ supporter_unlock: '€5.99', gift_small: '€1.99' });
  });

  it('keeps the last known prices but disallows buying when Play is unavailable', async () => {
    useSupporterStore.setState({ lastKnownPrices: { supporter_unlock: '€5.99' }, productsFresh: true });
    mockGetProducts.mockResolvedValue({ error: 'unavailable' });
    await useSupporterStore.getState().loadProducts();
    const state = useSupporterStore.getState();
    expect(state.playStatus).toBe('unavailable');
    expect(state.productsFresh).toBe(false);
    expect(state.lastKnownPrices).toEqual({ supporter_unlock: '€5.99' });
  });
});

describe('supporterStore — buy and purchase errors', () => {
  it('marks the product as purchasing while Play\'s sheet is open', async () => {
    mockStartPurchase.mockResolvedValue({ ok: true });
    await useSupporterStore.getState().buy('gift_small');
    expect(mockStartPurchase).toHaveBeenCalledWith('gift_small');
    expect(useSupporterStore.getState().purchasingId).toBe('gift_small');
  });

  it('clears purchasing on cancel', async () => {
    mockStartPurchase.mockResolvedValue({ error: 'cancelled' });
    await useSupporterStore.getState().buy('gift_small');
    expect(useSupporterStore.getState().purchasingId).toBeNull();
  });

  it('marks Play unavailable when the purchase cannot start', async () => {
    useSupporterStore.setState({ playStatus: 'ready', productsFresh: true });
    mockStartPurchase.mockResolvedValue({ error: 'unavailable' });
    await useSupporterStore.getState().buy('supporter_unlock');
    expect(useSupporterStore.getState().playStatus).toBe('unavailable');
    expect(useSupporterStore.getState().productsFresh).toBe(false);
  });

  it('syncs with Play when the unlock is already owned', async () => {
    mockGetOwnedPurchases.mockResolvedValue({ purchases: [purchase('supporter_unlock', { isAcknowledgedAndroid: true })] });
    useSupporterStore.getState().handlePurchaseError('owned');
    await useSupporterStore.getState().syncPurchases();
    expect(mockGetOwnedPurchases).toHaveBeenCalledTimes(1);
    expect(useSupporterStore.getState().isSupporter).toBe(true);
  });
});

describe('supporterStore — supporter banner', () => {
  const WAIT_MS = 7 * 24 * 60 * 60 * 1000;

  beforeEach(() => {
    useSupporterStore.setState({ bannerVisible: false, bannerNextShowAt: null });
  });

  it('shows the first time and waits 7 days before the next', () => {
    const before = Date.now();
    useSupporterStore.getState().showBannerIfDue();
    expect(useSupporterStore.getState().bannerVisible).toBe(true);
    expect(useSupporterStore.getState().bannerNextShowAt).toBeGreaterThanOrEqual(before + WAIT_MS);
  });

  it('stays away until its next show time', () => {
    useSupporterStore.setState({ bannerNextShowAt: Date.now() + 60_000 });
    useSupporterStore.getState().showBannerIfDue();
    expect(useSupporterStore.getState().bannerVisible).toBe(false);
  });

  it('shows again once the next show time has passed', () => {
    useSupporterStore.setState({ bannerNextShowAt: Date.now() - 1 });
    useSupporterStore.getState().showBannerIfDue();
    expect(useSupporterStore.getState().bannerVisible).toBe(true);
  });

  it('never shows for a supporter', () => {
    useSupporterStore.setState({ isSupporter: true });
    useSupporterStore.getState().showBannerIfDue();
    expect(useSupporterStore.getState().bannerVisible).toBe(false);
  });

  it('hides on request', () => {
    useSupporterStore.setState({ bannerVisible: true });
    useSupporterStore.getState().hideBanner();
    expect(useSupporterStore.getState().bannerVisible).toBe(false);
  });
});
