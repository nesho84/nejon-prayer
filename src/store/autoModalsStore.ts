import { sendFeedback } from "@/services/feedbackService";
import { useLanguageStore } from "@/store/languageStore";
import { mmkvStorage } from "@/store/storage";
import { FeedbackInput, FeedbackResult } from "@/types/feedback.types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type StoreUpdateResult = "available" | "upToDate" | "offline" | "error" | "timeout";

interface AutoModalsData {
  // Store update
  storeUpdateNextShowAt: number | null;
  storeUpdateShownAt: number | null;
  storeUpdateShownCount: number;
  storeUpdateCheckedAt: number | null;
  storeUpdateCheckResult: StoreUpdateResult | null;
  // Notif reminder
  notifReminderNextShowAt: number | null;
  notifReminderShownAt: number | null;
  notifReminderShownCount: number;
  notifReminderDone: boolean;
  // Rate App
  rateAppNextShowAt: number | null;
  rateAppShownAt: number | null;
  rateAppShownCount: number;
  rateAppDone: boolean;
  // Feedback
  feedbackNextShowAt: number | null;
  feedbackShownAt: number | null;
  feedbackShownCount: number;
  feedbackDone: boolean;
}

interface AutoModalsState extends AutoModalsData {
  isReady: boolean;
  setAutoModals: (patch: Partial<AutoModalsData>) => void;
  submitFeedback: (input: Omit<FeedbackInput, "language">) => Promise<FeedbackResult>;
}

export const DAY_MS = 24 * 60 * 60 * 1000;

// Store update — shows 1 and 2 come back next launch, then every 3 days; never stops
export const STORE_UPDATE_NEXT_LAUNCH_SHOWS = 2;
export const STORE_UPDATE_WAIT_DAYS = 3;
export const STORE_UPDATE_CHECK_TIMEOUT_MS = 5000;

// Notif reminder — 3 days after seen off, then 7 and 14 days after closing; 3 shows
export const NOTIF_REMINDER_FIRST_WAIT_DAYS = 3;
export const NOTIF_REMINDER_WAIT_DAYS = [7, 14];
export const NOTIF_REMINDER_MAX_SHOWS = 3;

// Rate App — no first wait, 7 days after "Later"; 3 shows
export const RATE_APP_WAIT_DAYS = 7;
export const RATE_APP_MAX_SHOWS = 3;

// Feedback — 7 days after onboarding, 30 days after "Maybe later" / close; 3 shows
export const FEEDBACK_FIRST_WAIT_DAYS = 7;
export const FEEDBACK_WAIT_DAYS = 30;
export const FEEDBACK_MAX_SHOWS = 3;

// Minimum gap between Rate App and Feedback (checked on both sides)
export const RATE_FEEDBACK_GAP_DAYS = 7;

const STORAGE_NAME = "auto-modals-storage";
const OLD_STORAGE_NAMES = ["rate-app-storage", "feedback-storage", "notif-reminder-storage"];

const INITIAL_DATA: AutoModalsData = {
  storeUpdateNextShowAt: null,
  storeUpdateShownAt: null,
  storeUpdateShownCount: 0,
  storeUpdateCheckedAt: null,
  storeUpdateCheckResult: null,
  notifReminderNextShowAt: null,
  notifReminderShownAt: null,
  notifReminderShownCount: 0,
  notifReminderDone: false,
  rateAppNextShowAt: null,
  rateAppShownAt: null,
  rateAppShownCount: 0,
  rateAppDone: false,
  feedbackNextShowAt: null,
  feedbackShownAt: null,
  feedbackShownCount: 0,
  feedbackDone: false,
};

// ------------------------------------------------------------
// Move the 3 old stores into this one (same key names) — before create() hydrates
// ------------------------------------------------------------
function migrateOldStores() {
  // MMKV is sync
  const getItem = (name: string) => mmkvStorage.getItem(name) as string | null;

  if (getItem(STORAGE_NAME) !== null) {
    return;
  }

  // Known keys only — drops feedbackLaunchCount
  const state: Record<string, unknown> = {};
  for (const name of OLD_STORAGE_NAMES) {
    const raw = getItem(name);
    if (raw === null) {
      continue;
    }
    try {
      const oldState = JSON.parse(raw).state ?? {};
      for (const key of Object.keys(INITIAL_DATA)) {
        if (key in oldState) {
          state[key] = oldState[key];
        }
      }
    } catch (err) {
      // Unreadable — skip this store instead of crashing the app on start
      console.warn(`⚠️ [autoModalsStore] Failed to migrate ${name}:`, err);
    }
  }

  if (Object.keys(state).length === 0) {
    return;
  }
  mmkvStorage.setItem(STORAGE_NAME, JSON.stringify({ state, version: 0 }));
  OLD_STORAGE_NAMES.forEach((name) => mmkvStorage.removeItem(name));
}

migrateOldStores();

export const useAutoModalsStore = create<AutoModalsState>()(
  persist(
    (set) => ({
      ...INITIAL_DATA,
      isReady: false,

      // Update any of the keys above
      setAutoModals: (patch) => {
        set(patch);
      },

      // Send the questionnaire — a successful send stops the feedback modal for good
      submitFeedback: async (input) => {
        const language = useLanguageStore.getState().language;
        const result = await sendFeedback({ ...input, language });

        if ("ok" in result) {
          set({ feedbackDone: true });
        }
        return result;
      },
    }),
    {
      name: STORAGE_NAME,
      storage: createJSONStorage(() => mmkvStorage),
      partialize: ({ isReady, setAutoModals, submitFeedback, ...data }) => data,
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isReady = true;
        }
      },
    }
  )
);
