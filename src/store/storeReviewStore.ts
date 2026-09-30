import { canRequestStoreReview, requestStoreReview } from "@/services/storeReviewService";
import { mmkvStorage } from "@/store/storage";
import { toDateKey } from "@/utils/datetime";
import Constants from "expo-constants";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface StoreReviewState {
  openDays: number;
  lastOpenDate: string | null;
  promptCount: number;
  lastPromptAt: number | null;
  lastPromptVersion: string | null;
  isReady: boolean;
  recordAppOpen: () => void;
  maybeRequestStoreReview: () => Promise<void>;
  makeEligible: () => void;
  reset: () => void;
}

// Eligibility gates — no lifetime cap: the platforms enforce their own quota
const MIN_OPEN_DAYS = 5;
const MIN_PROMPT_GAP_MS = 14 * 24 * 60 * 60 * 1000;

const INITIAL_STATE = {
  openDays: 0,
  lastOpenDate: null,
  promptCount: 0,
  lastPromptAt: null,
  lastPromptVersion: null,
};

// Every gate except hasAction() (async, platform-level). Also backs the Debug Panel's "eligible" field.
export const selectStoreReviewEligible = (state: StoreReviewState) =>
  state.openDays >= MIN_OPEN_DAYS &&
  (state.lastPromptAt === null || Date.now() - state.lastPromptAt > MIN_PROMPT_GAP_MS) &&
  state.lastPromptVersion !== (Constants.expoConfig?.version ?? null);

export const useStoreReviewStore = create<StoreReviewState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,
      isReady: false,

      // Counts distinct local days the app was opened (idempotent per day)
      recordAppOpen: () => {
        const today = toDateKey();
        if (get().lastOpenDate === today) {
          return;
        }
        set((state) => ({ openDays: state.openDays + 1, lastOpenDate: today }));
      },

      // Called after a positive moment (prayers celebration dismissed, khatam completed). No-ops unless every gate passes.
      maybeRequestStoreReview: async () => {
        // hasAction() first. Nothing below awaits until the claim, so concurrent calls can't both pass.
        if (!(await canRequestStoreReview())) {
          return;
        }

        const state = get();
        if (!selectStoreReviewEligible(state)) {
          return;
        }

        // Claim before requesting: the outcome is unknowable and a failure must not cause retries.
        // promptCount therefore counts attempts, not dialogs shown, and gates nothing (debug only).
        set({
          promptCount: state.promptCount + 1,
          lastPromptAt: Date.now(),
          lastPromptVersion: Constants.expoConfig?.version ?? null,
        });
        await requestStoreReview();
      },

      // Debug Panel: state under which the next real trigger passes every gate
      makeEligible: () => set({ openDays: MIN_OPEN_DAYS, promptCount: 0, lastPromptAt: null, lastPromptVersion: null }),

      reset: () => set(INITIAL_STATE),
    }),
    {
      name: "store-review-storage",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        openDays: state.openDays,
        lastOpenDate: state.lastOpenDate,
        promptCount: state.promptCount,
        lastPromptAt: state.lastPromptAt,
        lastPromptVersion: state.lastPromptVersion,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isReady = true;
        }
      },
    }
  )
);
