import { mmkvStorage } from "@/store/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface RateAppState {
  rateAppDone: boolean;
  rateAppVersion: string | null;
  rateAppRemindAt: number | null;
  rateAppShownAt: number | null;
  isReady: boolean;
  setRateAppDone: (rateAppDone: boolean) => void;
  setRateAppVersion: (rateAppVersion: string | null) => void;
  setRateAppRemindAt: (rateAppRemindAt: number | null) => void;
  setRateAppShownAt: (rateAppShownAt: number | null) => void;
}

export const useRateAppStore = create<RateAppState>()(
  persist(
    (set) => ({
      rateAppDone: false,
      rateAppVersion: null,
      rateAppRemindAt: null,
      rateAppShownAt: null,
      isReady: false,

      // User tapped "Already rated" — never show again
      setRateAppDone: (rateAppDone) => {
        set({ rateAppDone });
      },

      // App version on which the user tapped "Open Store"
      setRateAppVersion: (rateAppVersion) => {
        set({ rateAppVersion });
      },

      // Earliest time the "Rate the App" modal may show again
      setRateAppRemindAt: (rateAppRemindAt) => {
        set({ rateAppRemindAt });
      },

      // Last time the "Rate the App" modal was shown — keeps it apart from the feedback modal
      setRateAppShownAt: (rateAppShownAt) => {
        set({ rateAppShownAt });
      },
    }),
    {
      name: "rate-app-storage",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        rateAppDone: state.rateAppDone,
        rateAppVersion: state.rateAppVersion,
        rateAppRemindAt: state.rateAppRemindAt,
        rateAppShownAt: state.rateAppShownAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isReady = true;
        }
      },
    }
  )
);
