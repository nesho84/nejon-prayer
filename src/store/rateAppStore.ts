import { mmkvStorage } from "@/store/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface RateAppState {
  rateAppNextShowAt: number | null;
  rateAppShownAt: number | null;
  rateAppShownCount: number;
  rateAppDone: boolean;
  isReady: boolean;
  setRateAppNextShowAt: (rateAppNextShowAt: number | null) => void;
  setRateAppShownAt: (rateAppShownAt: number | null) => void;
  setRateAppShownCount: (rateAppShownCount: number) => void;
  setRateAppDone: (rateAppDone: boolean) => void;
}

export const useRateAppStore = create<RateAppState>()(
  persist(
    (set) => ({
      rateAppNextShowAt: null,
      rateAppShownAt: null,
      rateAppShownCount: 0,
      rateAppDone: false,
      isReady: false,

      // Earliest time the modal may show again
      setRateAppNextShowAt: (rateAppNextShowAt) => {
        set({ rateAppNextShowAt });
      },

      // Last time the modal was shown — keeps it apart from the feedback modal
      setRateAppShownAt: (rateAppShownAt) => {
        set({ rateAppShownAt });
      },

      // How many times the modal was shown
      setRateAppShownCount: (rateAppShownCount) => {
        set({ rateAppShownCount });
      },

      // Stopped for good — tapped "Open Store" or "Already rated", or shown the max times
      setRateAppDone: (rateAppDone) => {
        set({ rateAppDone });
      },
    }),
    {
      name: "rate-app-storage",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        rateAppNextShowAt: state.rateAppNextShowAt,
        rateAppShownAt: state.rateAppShownAt,
        rateAppShownCount: state.rateAppShownCount,
        rateAppDone: state.rateAppDone,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isReady = true;
        }
      },
    }
  )
);
