import { mmkvStorage } from "@/store/storage";
import { StoreUpdateResult } from "@/types/storeUpdate.types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

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
  // Store review
  storeReviewNextShowAt: number | null;
  storeReviewShownAt: number | null;
  storeReviewShownCount: number;
  storeReviewDone: boolean;
}

interface AutoModalsState extends AutoModalsData {
  isReady: boolean;
  setAutoModals: (patch: Partial<AutoModalsData>) => void;
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

// Store review — no first wait, 7 days after "Later"; 3 shows
export const STORE_REVIEW_WAIT_DAYS = 7;
export const STORE_REVIEW_MAX_SHOWS = 3;

// Old stores replaced by this one — delete their leftovers (values aren't carried over)
const OLD_STORAGE_NAMES = ["rate-app-storage", "feedback-storage", "notif-reminder-storage"];
OLD_STORAGE_NAMES.forEach((name) => mmkvStorage.removeItem(name));

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
  storeReviewNextShowAt: null,
  storeReviewShownAt: null,
  storeReviewShownCount: 0,
  storeReviewDone: false,
};

export const useAutoModalsStore = create<AutoModalsState>()(
  persist(
    (set) => ({
      ...INITIAL_DATA,
      isReady: false,

      // Update any of the keys above
      setAutoModals: (patch) => {
        set(patch);
      },
    }),
    {
      name: "auto-modals-storage",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: ({ isReady, setAutoModals, ...data }) => data,
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isReady = true;
        }
      },
    }
  )
);
