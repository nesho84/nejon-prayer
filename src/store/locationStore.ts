import { formatUserAddress, getTimeZoneInfo } from "@/services/locationService";
import { mmkvStorage } from "@/store/storage";
import { Cords, TimeZone } from "@/types/location.types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface LocationState {
  location: Cords | null;
  fullAddress: string | null;
  timeZone: TimeZone | null;
  isReady: boolean;
  setLocation: (location: Cords | null, fullAddress: string | null, timeZone: TimeZone | null) => void;
  refreshAddress: () => Promise<void>;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      location: null,
      fullAddress: null,
      timeZone: null,
      isReady: false,

      setLocation: (location, fullAddress, timeZone) => {
        set({ location, fullAddress, timeZone });
      },

      // Reverse geocoding fails offline, leaving the address as raw coordinates.
      // Retries it for the stored coordinates — no GPS, no permission prompt.
      refreshAddress: async () => {
        const { location, timeZone } = get();
        if (!location || !timeZone?.offline) return;

        const [newAddress, newTimeZone] = await Promise.all([
          formatUserAddress(location),
          getTimeZoneInfo(location),
        ]);

        // Keep the coordinates if the geocode failed again
        if (newTimeZone && !newTimeZone.offline) {
          set({ fullAddress: newAddress, timeZone: newTimeZone });
          console.log("📍 [locationStore] Address re-resolved:", newTimeZone.location);
        }
      },
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
          state.isReady = true;
        }
      },
    }
  )
);
