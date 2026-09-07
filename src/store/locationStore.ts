import { formatUserAddress, getTimeZoneInfo } from "@/services/locationService";
import { mmkvStorage } from "@/store/storage";
import { Cords, TimeZone } from "@/types/location.types";
import * as Location from "expo-location";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface LocationState {
  location: Cords | null;
  fullAddress: string | null;
  timeZone: TimeZone | null;
  locationChanged: boolean;
  lastLocationCheck: number | null;
  isReady: boolean;
  setLocation: (location: Cords | null, fullAddress: string | null, timeZone: TimeZone | null) => void;
  refreshAddress: () => Promise<void>;
  checkLocationChange: () => Promise<void>;
  resetLocationCheck: () => void;
}

// How far the device must be from the saved coordinates before the warning shows
const LOCATION_CHANGE_THRESHOLD_KM = 50;
// Minimum gap between two checks — collapses bursts of foreground events (app switching, the
// notification shade). A check only runs on launch or foreground, so this is a floor, not a
// timer. Not persisted, so it resets on every app start.
const LOCATION_CHECK_INTERVAL_MS = 15 * 60 * 1000;
// expo-location ignores a `timeout` option, and a fix can hang when no provider ever answers.
// Without this the mutex below would stay locked for the rest of the session.
const LOCATION_PROBE_TIMEOUT_MS = 10 * 1000;

// One check at a time — a fix can outlast the foreground event that asked for it, and
// lastLocationCheck is only written once it resolves, so overlapping calls would each probe
let checkInProgress = false;

// Distance in km between two lat/lng pairs, over the curve of the Earth (haversine formula)
const distanceKm = (a: Cords, b: Cords): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

// Current coordinates, or null if permission is missing or the fix fails.
// Checks permission without prompting, and takes the cached position before asking for a fresh low-accuracy one.
const getProbeLocation = async (): Promise<Cords | null> => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") return null;

    const lastKnown = await Location.getLastKnownPositionAsync({
      maxAge: 60 * 60 * 1000,
      requiredAccuracy: 5000,
    });
    if (lastKnown?.coords) return lastKnown.coords;

    // mayShowUserSettingsDialog defaults to true on Android and would pop a system dialog
    // asking to turn on improved accuracy — this check has to stay silent
    const current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Low,
      mayShowUserSettingsDialog: false,
    });
    return current?.coords ?? null;
  } catch (err) {
    console.warn("⚠️ [locationStore] Location probe failed:", err);
    return null;
  }
};

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      location: null,
      fullAddress: null,
      timeZone: null,
      locationChanged: false,
      lastLocationCheck: null,
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

      // Sets locationChanged when the device is more than LOCATION_CHANGE_THRESHOLD_KM from the
      // saved coordinates. Runs on app start and on every foreground, throttled by the interval.
      checkLocationChange: async () => {
        const { location, lastLocationCheck } = get();
        if (!location || checkInProgress) return;
        if (lastLocationCheck && Date.now() - lastLocationCheck < LOCATION_CHECK_INTERVAL_MS) return;

        checkInProgress = true;
        let probeTimeout: ReturnType<typeof setTimeout> | undefined;
        try {
          // Not writing lastLocationCheck here makes the next foreground retry straight away
          // instead of waiting out the throttle
          const probe = await Promise.race([
            getProbeLocation(),
            new Promise<null>((resolve) => {
              probeTimeout = setTimeout(() => resolve(null), LOCATION_PROBE_TIMEOUT_MS);
            }),
          ]);
          if (!probe) return;

          // Settings can save a new location while the probe is running. This result was
          // measured against coordinates that no longer apply, so drop it.
          if (get().location !== location) return;

          const distance = distanceKm(location, probe);
          set({
            locationChanged: distance >= LOCATION_CHANGE_THRESHOLD_KM,
            lastLocationCheck: Date.now(),
          });
          console.log(`📍 [locationStore] Location check: ${distance.toFixed(1)} km from saved`);
        } finally {
          clearTimeout(probeTimeout);
          checkInProgress = false;
        }
      },

      // Hides the warning and clears the throttle. Called from Settings after the user updates
      // the location, so the next foreground re-checks against the new coordinates.
      resetLocationCheck: () => {
        set({ locationChanged: false, lastLocationCheck: null });
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
