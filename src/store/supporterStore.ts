import { GIFT_IDS, SUPPORTER_PRODUCT_IDS, SUPPORTER_UNLOCK_ID } from "@/constants/supporter";
import { finishPurchase, getOwnedPurchases, getProducts, startPurchase } from "@/services/billingService";
import { mmkvStorage } from "@/store/storage";
import { BillingError, BillingPurchase } from "@/types/billing.types";
import { GiftId, SupporterProductId } from "@/types/supporter.types";
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
  syncPurchases: () => Promise<boolean>;
  loadProducts: () => Promise<void>;
  buy: (id: SupporterProductId) => Promise<void>;
  handlePurchase: (purchase: BillingPurchase) => Promise<void>;
  handlePurchaseError: (error: BillingError) => void;
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
// (closing Play's payment sheet also counts as a return to the app)
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

      // Ask Play what this Google account owns. A failed query keeps the cached state;
      // a successful one is the truth — no unlock in it means refunded/revoked.
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

      // Fresh product details; on failure the screen keeps showing lastKnownPrices, marked as such
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

      // One purchase from Play (listener or sync). Pending never unlocks anything.
      handlePurchase: async (purchase) => {
        set({ purchasingId: null });
        const { productId, purchaseState } = purchase;

        if (purchaseState === "pending") {
          set(productId === SUPPORTER_UNLOCK_ID ? { unlockPending: true } : { giftPending: true });
          return;
        }
        if (purchaseState !== "purchased" || finishing.has(purchase.id)) {
          return;
        }

        if (productId === SUPPORTER_UNLOCK_ID) {
          set({ isSupporter: true, supporterSince: purchase.transactionDate, unlockPending: false });
          if (isAcknowledged(purchase)) {
            return;
          }
        } else if (isGift(productId)) {
          set({ lastGiftAt: purchase.transactionDate, giftPending: false });
        } else {
          return;
        }

        // Unlock → acknowledge, gift → consume. A failure is retried by the next sync.
        finishing.add(purchase.id);
        await finishPurchase(purchase, isGift(productId));
        finishing.delete(purchase.id);
      },

      handlePurchaseError: (error) => {
        set({ purchasingId: null });
        if (error === "unavailable") {
          set({ playStatus: "unavailable", productsFresh: false });
        }
        // Bought on another device, or not acknowledged here yet
        if (error === "owned") {
          get().syncPurchases();
        }
      },
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
