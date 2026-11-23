import type * as BillingServiceModule from '@/services/billingService';

jest.mock('expo-iap', () => ({
  ErrorCode: {
    UserCancelled: 'user-cancelled',
    AlreadyOwned: 'already-owned',
    NetworkError: 'network-error',
    ServiceDisconnected: 'service-disconnected',
    ServiceError: 'service-error',
    ServiceTimeout: 'service-timeout',
    ConnectionClosed: 'connection-closed',
    BillingUnavailable: 'billing-unavailable',
    IapNotAvailable: 'iap-not-available',
    ItemUnavailable: 'item-unavailable',
    InitConnection: 'init-connection',
    NotPrepared: 'not-prepared',
    RemoteError: 'remote-error',
    DeveloperError: 'developer-error',
  },
  initConnection: jest.fn(),
  fetchProducts: jest.fn(),
  requestPurchase: jest.fn(),
  getAvailablePurchases: jest.fn(),
  finishTransaction: jest.fn(),
  purchaseUpdatedListener: jest.fn(),
  purchaseErrorListener: jest.fn(),
}));

jest.mock('@sentry/react-native', () => ({ captureException: jest.fn() }));

// The service keeps its Play connection in module state — load a fresh copy per test
let service: typeof BillingServiceModule;
let iap: Record<string, jest.Mock>;
let Sentry: { captureException: jest.Mock };

beforeEach(() => {
  jest.resetModules();
  service = require('@/services/billingService');
  iap = require('expo-iap');
  Sentry = require('@sentry/react-native');
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  iap.initConnection.mockResolvedValue(true);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('billingService — connection', () => {
  it('connects once and reuses the connection', async () => {
    iap.fetchProducts.mockResolvedValue([{ id: 'supporter_unlock', displayPrice: '€5.99' }]);
    await service.fetchBillingProducts();
    await service.fetchBillingProducts();
    expect(iap.initConnection).toHaveBeenCalledTimes(1);
  });

  it('returns unavailable when Play does not connect, and retries next time', async () => {
    iap.initConnection.mockResolvedValueOnce(false);
    expect(await service.fetchBillingProducts()).toEqual({ error: 'unavailable' });
    expect(iap.fetchProducts).not.toHaveBeenCalled();

    iap.fetchProducts.mockResolvedValue([{ id: 'supporter_unlock', displayPrice: '€5.99' }]);
    expect(await service.fetchBillingProducts()).toEqual({
      products: [{ id: 'supporter_unlock', displayPrice: '€5.99' }],
    });
    expect(iap.initConnection).toHaveBeenCalledTimes(2);
  });

  it('returns unavailable when the connection throws', async () => {
    iap.initConnection.mockRejectedValueOnce(new Error('no Play Store'));
    expect(await service.getOwnedPurchases()).toEqual({ error: 'unavailable' });
  });

  it('gives up when Play never answers', async () => {
    jest.useFakeTimers();
    iap.initConnection.mockReturnValue(new Promise(() => undefined));
    const result = service.connectBilling();
    jest.advanceTimersByTime(8000);
    expect(await result).toBe(false);
  });
});

describe('billingService — fetchBillingProducts', () => {
  it('requests all four in-app products', async () => {
    iap.fetchProducts.mockResolvedValue([{ id: 'gift_small', displayPrice: '€1.99' }]);
    await service.fetchBillingProducts();
    expect(iap.fetchProducts).toHaveBeenCalledWith({
      skus: ['supporter_unlock', 'gift_small', 'gift_medium', 'gift_large'],
      type: 'in-app',
    });
  });

  it('keeps only products Play can sell, with their display price', async () => {
    iap.fetchProducts.mockResolvedValue([
      { id: 'supporter_unlock', displayPrice: '€5.99', productStatusAndroid: 'ok', price: 5.99 },
      { id: 'gift_small', displayPrice: '€1.99' },
      { id: 'gift_large', displayPrice: '€9.99', productStatusAndroid: 'not-found' },
    ]);
    expect(await service.fetchBillingProducts()).toEqual({
      products: [
        { id: 'supporter_unlock', displayPrice: '€5.99' },
        { id: 'gift_small', displayPrice: '€1.99' },
      ],
    });
  });

  it('treats no sellable products as unavailable', async () => {
    iap.fetchProducts.mockResolvedValue([{ id: 'gift_small', displayPrice: '', productStatusAndroid: 'no-offers-available' }]);
    expect(await service.fetchBillingProducts()).toEqual({ error: 'unavailable' });
    iap.fetchProducts.mockResolvedValue(null);
    expect(await service.fetchBillingProducts()).toEqual({ error: 'unavailable' });
  });

  it('maps network errors to unavailable without Sentry, and reconnects next time', async () => {
    iap.fetchProducts.mockRejectedValueOnce({ code: 'network-error' });
    expect(await service.fetchBillingProducts()).toEqual({ error: 'unavailable' });
    expect(Sentry.captureException).not.toHaveBeenCalled();

    iap.fetchProducts.mockResolvedValue([{ id: 'gift_small', displayPrice: '€1.99' }]);
    await service.fetchBillingProducts();
    expect(iap.initConnection).toHaveBeenCalledTimes(2);
  });

  it('reports unexpected errors to Sentry', async () => {
    const err = { code: 'developer-error' };
    iap.fetchProducts.mockRejectedValueOnce(err);
    expect(await service.fetchBillingProducts()).toEqual({ error: 'failed' });
    expect(Sentry.captureException).toHaveBeenCalledWith(err);
  });
});

describe('billingService — startPurchase', () => {
  it('opens the Play purchase sheet for the product', async () => {
    iap.requestPurchase.mockResolvedValue(null);
    expect(await service.startPurchase('gift_medium')).toEqual({ ok: true });
    expect(iap.requestPurchase).toHaveBeenCalledWith({
      request: { google: { skus: ['gift_medium'] } },
      type: 'in-app',
    });
  });

  it('maps a cancel to cancelled without Sentry', async () => {
    iap.requestPurchase.mockRejectedValue({ code: 'user-cancelled' });
    expect(await service.startPurchase('supporter_unlock')).toEqual({ error: 'cancelled' });
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('maps an already-owned unlock to owned', async () => {
    iap.requestPurchase.mockRejectedValue({ code: 'already-owned' });
    expect(await service.startPurchase('supporter_unlock')).toEqual({ error: 'owned' });
  });
});

describe('billingService — getOwnedPurchases', () => {
  it('returns what Play holds for the account', async () => {
    const purchases = [{ productId: 'supporter_unlock', purchaseState: 'purchased' }];
    iap.getAvailablePurchases.mockResolvedValue(purchases);
    expect(await service.getOwnedPurchases()).toEqual({ purchases });
  });

  it('maps a failed query to unavailable', async () => {
    iap.getAvailablePurchases.mockRejectedValue({ code: 'service-disconnected' });
    expect(await service.getOwnedPurchases()).toEqual({ error: 'unavailable' });
  });
});

describe('billingService — finishPurchase', () => {
  const purchase = { productId: 'gift_small', purchaseToken: 'token' } as any;

  it('consumes gifts and acknowledges the unlock', async () => {
    iap.finishTransaction.mockResolvedValue(undefined);
    expect(await service.finishPurchase(purchase, true)).toBe(true);
    expect(iap.finishTransaction).toHaveBeenCalledWith({ purchase, isConsumable: true });
    await service.finishPurchase(purchase, false);
    expect(iap.finishTransaction).toHaveBeenLastCalledWith({ purchase, isConsumable: false });
  });

  it('returns false on failure so the next reconcile retries', async () => {
    iap.finishTransaction.mockRejectedValue({ code: 'network-error' });
    expect(await service.finishPurchase(purchase, true)).toBe(false);
  });
});

describe('billingService — addPurchaseListeners', () => {
  it('forwards purchases, maps errors, and removes both listeners', () => {
    const removeUpdated = jest.fn();
    const removeError = jest.fn();
    iap.purchaseUpdatedListener.mockReturnValue({ remove: removeUpdated });
    iap.purchaseErrorListener.mockReturnValue({ remove: removeError });
    const onPurchase = jest.fn();
    const onError = jest.fn();

    const unsubscribe = service.addPurchaseListeners(onPurchase, onError);

    const purchase = { productId: 'gift_small', purchaseState: 'pending' };
    iap.purchaseUpdatedListener.mock.calls[0][0](purchase);
    expect(onPurchase).toHaveBeenCalledWith(purchase);

    iap.purchaseErrorListener.mock.calls[0][0]({ code: 'user-cancelled' });
    expect(onError).toHaveBeenCalledWith('cancelled');

    unsubscribe();
    expect(removeUpdated).toHaveBeenCalled();
    expect(removeError).toHaveBeenCalled();
  });
});
