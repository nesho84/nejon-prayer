import {
  GIFT_IDS,
  GiftId,
  SUPPORTER_PRODUCT_IDS,
  SUPPORTER_UNLOCK_ID,
  SupporterProductId,
} from "@/constants/supporter";
import { finishPurchase, getOwnedPurchases, getProducts, startPurchase } from "@/services/billingService";
import { mmkvStorage } from "@/store/storage";
import { BillingError, BillingPurchase } from "@/types/billing.types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// What Play last confirmed — the offline copy. Play stays the source of truth.
interface SupporterData {
  isSupporter: boolean;
  supporterSince: number | null;   // Play's purchase time, so it's right after a reinstall
  unlockPending: boolean;          // payment not cleared yet — nothing unlocks
  giftPending: boolean;
  lastGiftAt: number | null;       // this device only — Play forgets consumed gifts
  lastKnownPrices: Partial<Record<SupporterProductId, string>>; // display only, never used to buy
}

interface SupporterState extends SupporterData {
  isReady: boolean;
  entitlementChecked: boolean;     // first Play check finished (or failed) — the ads gate waits on it
  playStatus: "loading" | "ready" | "unavailable";
  productsFresh: boolean;          // details fetched this session — the only state buying is allowed in
  purchasingId: SupporterProductId | null;
  bannerVisible: boolean;
  syncPurchases: () => Promise<boolean>;
  loadProducts: () => Promise<void>;
  buy: (id: SupporterProductId) => Promise<void>;
  handlePurchase: (purchase: BillingPurchase) => Promise<void>;
  handlePurchaseError: (error: BillingError) => void;
  showBanner: () => void;
  hideBanner: () => void;
}

const INITIAL_DATA: SupporterData = {
  isSupporter: false,
  supporterSince: null,
  unlockPending: false,
  giftPending: false,
  lastGiftAt: null,
  lastKnownPrices: {},
};

// Coalescing mutex — launch, foreground and Restore share one Play query
let syncInProgress: Promise<boolean> | null = null;
// Purchases being acknowledged/consumed — the listener and a sync can see the same one
const finishing = new Set<string>();

const isGift = (id: string): id is GiftId => (GIFT_IDS as string[]).includes(id);
const isAcknowledged = (p: BillingPurchase) => "isAcknowledgedAndroid" in p && p.isAcknowledgedAndroid === true;

export const useSupporterStore = create<SupporterState>()(
  persist(
    (set, get) => ({
      ...INITIAL_DATA,
      isReady: false,
      entitlementChecked: false,
      playStatus: "loading",
      productsFresh: false,
      purchasingId: null,
      bannerVisible: false,

      // Sync with what this Google account owns (a failed query keeps the cache)
      syncPurchases: () => {
        if (syncInProgress) {
          return syncInProgress;
        }
        syncInProgress = (async () => {
          try {
            const result = await getOwnedPurchases();
            if ("error" in result) {
              return false;
            }
            const { purchases } = result;
            if (!purchases.some((p) => p.productId === SUPPORTER_UNLOCK_ID)) {
              set({ isSupporter: false, supporterSince: null, unlockPending: false });
            }
            if (!purchases.some((p) => isGift(p.productId) && p.purchaseState === "pending")) {
              set({ giftPending: false });
            }
            for (const purchase of purchases) {
              await get().handlePurchase(purchase);
            }
            return true;
          } finally {
            set({ entitlementChecked: true });
            syncInProgress = null; // in-body finally
          }
        })();
        return syncInProgress;
      },

      // Load fresh product details
      loadProducts: async () => {
        set({ playStatus: "loading" });
        const result = await getProducts(SUPPORTER_PRODUCT_IDS);
        if ("error" in result) {
          set({ playStatus: "unavailable", productsFresh: false });
          return;
        }
        const lastKnownPrices = Object.fromEntries(result.products.map((p) => [p.id, p.displayPrice]));
        set({ playStatus: "ready", productsFresh: true, lastKnownPrices });
      },

      buy: async (id) => {
        set({ purchasingId: id });
        const result = await startPurchase(id);
        if ("error" in result) {
          get().handlePurchaseError(result.error);
        }
      },

      // Handle one purchase from Play (listener or sync)
      handlePurchase: async (purchase) => {
        set({ purchasingId: null });
        const { productId, purchaseState } = purchase;

        // Pending — nothing unlocks yet
        if (purchaseState === "pending" && productId === SUPPORTER_UNLOCK_ID) {
          set({ unlockPending: true });
          return;
        }
        if (purchaseState === "pending") {
          set({ giftPending: true });
          return;
        }
        if (purchaseState !== "purchased" || finishing.has(purchase.id)) {
          return;
        }
        if (productId !== SUPPORTER_UNLOCK_ID && !isGift(productId)) {
          return;
        }

        if (productId === SUPPORTER_UNLOCK_ID) {
          set({ isSupporter: true, supporterSince: purchase.transactionDate, unlockPending: false });
        }
        if (productId === SUPPORTER_UNLOCK_ID && isAcknowledged(purchase)) {
          return;
        }
        if (isGift(productId)) {
          set({ lastGiftAt: purchase.transactionDate, giftPending: false });
        }

        // Unlock → acknowledge, gift → consume (retried by the next sync)
        finishing.add(purchase.id);
        await finishPurchase(purchase, isGift(productId));
        finishing.delete(purchase.id);
      },

      handlePurchaseError: (error) => {
        set({ purchasingId: null });
        if (error === "unavailable") {
          set({ playStatus: "unavailable", productsFresh: false });
        }
        // Already owned — sync to pick it up
        if (error === "owned") {
          get().syncPurchases();
        }
      },

      // Show the supporter banner every time the ad banner is closed
      showBanner: () => {
        if (get().isSupporter) {
          return;
        }
        set({ bannerVisible: true });
      },

      hideBanner: () => set({ bannerVisible: false }),
    }),
    {
      name: "supporter-storage",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        isSupporter: state.isSupporter,
        supporterSince: state.supporterSince,
        unlockPending: state.unlockPending,
        giftPending: state.giftPending,
        lastGiftAt: state.lastGiftAt,
        lastKnownPrices: state.lastKnownPrices,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isReady = true;
        }
      },
    }
  )
);
