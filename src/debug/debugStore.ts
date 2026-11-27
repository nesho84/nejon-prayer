import { mmkvStorage } from "@/store/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// ------------------------------------------------------------
// Debug-only store backing the Debug Panel toggles.
// forceStoreUpdateOnLaunch and debugModeEnabled persist across reloads; the rest reset to OFF.
// ------------------------------------------------------------

export type StoreUpdatePreview = "idle" | "upToDate" | "error";
export type SupporterPreview = "idle" | "canBuy" | "pending" | "unreachable" | "giftPending" | "supporter";

interface DebugState {
  debugModeEnabled: boolean;
  forceHoliday: boolean;
  forceFriday: boolean;
  forceQuranPlaying: boolean;
  forcePrayersOutdated: boolean;
  forceLocationChange: boolean;
  forceNoPrayerTimes: boolean;
  forceStoreUpdateOnLaunch: boolean;
  storeUpdatePreview: StoreUpdatePreview;
  supporterPreview: SupporterPreview;
  forceSupporterGift: boolean;
  forceSupporterBanner: boolean;
  isReady: boolean;
  toggleHoliday: () => void;
  toggleFriday: () => void;
  toggleQuranPlaying: () => void;
  togglePrayersOutdated: () => void;
  toggleLocationChange: () => void;
  toggleNoPrayerTimes: () => void;
  toggleStoreUpdateOnLaunch: () => void;
  toggleDebugMode: () => void;
  setStoreUpdatePreview: (value: StoreUpdatePreview) => void;
  setSupporterPreview: (value: SupporterPreview) => void;
  toggleSupporterGift: () => void;
  toggleSupporterBanner: () => void;
}

export const useDebugStore = create<DebugState>()(
  persist(
    (set) => ({
      debugModeEnabled: false,
      forceHoliday: false,
      forceFriday: false,
      forceQuranPlaying: false,
      forcePrayersOutdated: false,
      forceLocationChange: false,
      forceNoPrayerTimes: false,
      forceStoreUpdateOnLaunch: false,
      storeUpdatePreview: "idle",
      supporterPreview: "idle",
      forceSupporterGift: false,
      forceSupporterBanner: false,
      isReady: false,

      toggleHoliday: () => set((s) => ({ forceHoliday: !s.forceHoliday })),
      toggleFriday: () => set((s) => ({ forceFriday: !s.forceFriday })),
      toggleQuranPlaying: () => set((s) => ({ forceQuranPlaying: !s.forceQuranPlaying })),
      togglePrayersOutdated: () => set((s) => ({ forcePrayersOutdated: !s.forcePrayersOutdated })),
      toggleLocationChange: () => set((s) => ({ forceLocationChange: !s.forceLocationChange })),
      toggleNoPrayerTimes: () => set((s) => ({ forceNoPrayerTimes: !s.forceNoPrayerTimes })),
      toggleStoreUpdateOnLaunch: () => set((s) => ({ forceStoreUpdateOnLaunch: !s.forceStoreUpdateOnLaunch })),
      toggleDebugMode: () => set((s) => ({ debugModeEnabled: !s.debugModeEnabled })),
      setStoreUpdatePreview: (value) => set({ storeUpdatePreview: value }),
      setSupporterPreview: (value) => set({ supporterPreview: value }),
      toggleSupporterGift: () => set((s) => ({ forceSupporterGift: !s.forceSupporterGift })),
      toggleSupporterBanner: () => set((s) => ({ forceSupporterBanner: !s.forceSupporterBanner })),
    }),
    {
      name: "debug-storage",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        debugModeEnabled: state.debugModeEnabled,
        forceStoreUpdateOnLaunch: state.forceStoreUpdateOnLaunch,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isReady = true;
        }
      },
    }
  )
);
