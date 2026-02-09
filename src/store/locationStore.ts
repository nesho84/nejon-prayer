import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvStorage } from "./storage";
import { Coordinates, TimeZone } from "@/types/location.types";

interface LocationState {
  location: Coordinates | null;
  fullAddress: string | null;
  timeZone: TimeZone | null;
  isReady: boolean;
  setLocation: (
    location: Coordinates | null,
    fullAddress: string | null,
    timeZone: TimeZone | null
  ) => void;
  setReady: (isReady: boolean) => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      location: null,
      fullAddress: null,
      timeZone: null,
      isReady: false,

      setLocation: (location, fullAddress, timeZone) => {
        set({ location, fullAddress, timeZone });
      },

      setReady: (ready) => set({ isReady: ready }),
    }),
    {
      name: 'location-storage',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        location: state.location,
        fullAddress: state.fullAddress,
        timeZone: state.timeZone,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setReady(true);
        }
      },
    }
  )
);