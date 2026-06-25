import { mmkvStorage } from "@/store/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// ------------------------------------------------------------
// Debug-only store backing the Debug Panel toggles. Only forceUpdateOnLaunch
// is persisted (needs to survive a reload); the rest reset to OFF on restart.
// ------------------------------------------------------------

export type UpdatePreview = "idle" | "upToDate" | "error";

interface DebugState {
  forceHoliday: boolean;
  forceFriday: boolean;
  forceQuranPlaying: boolean;
  forceUpdateOnLaunch: boolean;
  updatePreview: UpdatePreview;
  toggleHoliday: () => void;
  toggleFriday: () => void;
  toggleQuranPlaying: () => void;
  toggleUpdateOnLaunch: () => void;
  setUpdatePreview: (value: UpdatePreview) => void;
}

export const useDebugStore = create<DebugState>()(
  persist(
    (set) => ({
      forceHoliday: false,
      forceFriday: false,
      forceQuranPlaying: false,
      forceUpdateOnLaunch: false,
      updatePreview: "idle",

      toggleHoliday: () => set((s) => ({ forceHoliday: !s.forceHoliday })),
      toggleFriday: () => set((s) => ({ forceFriday: !s.forceFriday })),
      toggleQuranPlaying: () => set((s) => ({ forceQuranPlaying: !s.forceQuranPlaying })),
      toggleUpdateOnLaunch: () => set((s) => ({ forceUpdateOnLaunch: !s.forceUpdateOnLaunch })),
      setUpdatePreview: (value) => set({ updatePreview: value }),
    }),
    {
      name: "debug-storage",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        forceUpdateOnLaunch: state.forceUpdateOnLaunch,
      }),
    }
  )
);
