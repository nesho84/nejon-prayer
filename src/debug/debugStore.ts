import { mmkvStorage } from "@/store/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// ------------------------------------------------------------
// Debug-only store backing the Debug Panel toggles. forceUpdateOnLaunch and
// debugModeEnabled are persisted (need to survive a reload); the rest reset
// to OFF on restart.
// ------------------------------------------------------------

export type UpdatePreview = "idle" | "upToDate" | "error";

interface DebugState {
  debugModeEnabled: boolean;
  forceHoliday: boolean;
  forceFriday: boolean;
  forceQuranPlaying: boolean;
  forceUpdateOnLaunch: boolean;
  updatePreview: UpdatePreview;
  isReady: boolean;
  toggleHoliday: () => void;
  toggleFriday: () => void;
  toggleQuranPlaying: () => void;
  toggleUpdateOnLaunch: () => void;
  toggleDebugMode: () => void;
  setUpdatePreview: (value: UpdatePreview) => void;
}

export const useDebugStore = create<DebugState>()(
  persist(
    (set) => ({
      debugModeEnabled: false,
      forceHoliday: false,
      forceFriday: false,
      forceQuranPlaying: false,
      forceUpdateOnLaunch: false,
      updatePreview: "idle",
      isReady: false,

      toggleHoliday: () => set((s) => ({ forceHoliday: !s.forceHoliday })),
      toggleFriday: () => set((s) => ({ forceFriday: !s.forceFriday })),
      toggleQuranPlaying: () => set((s) => ({ forceQuranPlaying: !s.forceQuranPlaying })),
      toggleUpdateOnLaunch: () => set((s) => ({ forceUpdateOnLaunch: !s.forceUpdateOnLaunch })),
      toggleDebugMode: () => set((s) => ({ debugModeEnabled: !s.debugModeEnabled })),
      setUpdatePreview: (value) => set({ updatePreview: value }),
    }),
    {
      name: "debug-storage",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        debugModeEnabled: state.debugModeEnabled,
        forceUpdateOnLaunch: state.forceUpdateOnLaunch,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isReady = true;
        }
      },
    }
  )
);
