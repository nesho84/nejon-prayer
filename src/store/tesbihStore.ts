import { mmkvStorage } from "@/store/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface TesbihState {
  count: number;
  totalCount: number;
  laps: number;
  isReady: boolean;
  setCount: () => void | boolean;
  reset: () => void;
  setPreset: (value: number) => void;
  incrementTotal: () => void;
  decrementTotal: () => void;
}

export const useTesbihStore = create<TesbihState>()(
  persist(
    (set, get) => ({
      count: 0,
      totalCount: 10,
      laps: 0,
      isReady: false,

      // Sets count and checks if totalCount was reached
      setCount: () => {
        const { count, totalCount, laps } = get();
        if (count + 1 >= totalCount) {
          set({ count: 0, laps: laps + 1 });
          return true; // totalCount was reached
        } else {
          set({ count: count + 1 });
        }
      },

      reset: () => {
        set({ count: 0, laps: 0 });
      },

      setPreset: (value: number) => {
        set({ totalCount: value, count: 0, laps: 0 });
      },

      incrementTotal: () => {
        const { totalCount } = get();
        set({ totalCount: totalCount + 1, count: 0, laps: 0 });
      },

      decrementTotal: () => {
        const { totalCount } = get();
        if (totalCount > 1) {
          set({ totalCount: totalCount - 1, count: 0, laps: 0 });
        }
      },
    }),
    {
      name: "tesbih-storage",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        count: state.count,
        totalCount: state.totalCount,
        laps: state.laps,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isReady = true;
        }
      },
    }
  )
);