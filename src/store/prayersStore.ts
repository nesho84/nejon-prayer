import { getUserLocation, hasLocationChanged } from '@/services/locationService';
import { getYearlyPrayerTimes } from '@/services/prayersService';
import { useDeviceSettingsStore } from '@/store/deviceSettingsStore';
import { useLanguageStore } from '@/store/languageStore';
import { useLocationStore } from '@/store/locationStore';
import { mmkvStorage } from '@/store/storage';
import { PrayerTimes, YearlyPrayerTimes } from '@/types/prayer.types';
import { toDateKey } from '@/utils/dateKey';
import * as Sentry from '@sentry/react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface PrayersState {
  prayerTimes: PrayerTimes | null;
  prayersError: string | null;
  prayersOutdated: boolean;
  lastFetchedDate: string | null;
  isLoading: boolean;
  isReady: boolean;
  yearlyPrayerTimes: YearlyPrayerTimes | null;
  fetchedYear: number | null;
  loadPrayerTimes: () => Promise<void>;
  reloadPrayerTimes: () => Promise<void>;
  getPrayerTimesForDate: (dateKey: string) => Promise<PrayerTimes | null>;
}

export const usePrayersStore = create<PrayersState>()(
  persist(
    (set, get) => ({
      prayerTimes: null,
      prayersError: null,
      prayersOutdated: false,
      lastFetchedDate: null,
      isLoading: false,
      isReady: false,
      yearlyPrayerTimes: null,
      fetchedYear: null,

      // Load prayer times (uses existing location)
      loadPrayerTimes: async () => {
        set({ isLoading: true, prayersError: null, prayersOutdated: false });

        try {
          const location = useLocationStore.getState().location;
          const internetConnection = useDeviceSettingsStore.getState().internetConnection;
          const tr = useLanguageStore.getState().tr;

          // Validate location first
          if (!location) {
            set({ prayerTimes: null, prayersError: tr.labels.locationSet });
            return;
          }

          // Compute today's date key
          const now = new Date();
          const currentYear = now.getFullYear();
          const todayKey = toDateKey(now);

          const { yearlyPrayerTimes, fetchedYear } = get();

          // Already have data for this year — derive today's times locally
          if (yearlyPrayerTimes && fetchedYear === currentYear) {
            const todaysTimes = yearlyPrayerTimes[todayKey] ?? null;
            if (todaysTimes) {
              set({ prayerTimes: todaysTimes, prayersOutdated: false });
              console.log('💾 [prayersStore] Prayer times loaded from stored yearly data');
              return;
            }
          }

          // ONLINE: Need to fetch — first time, new year, or cache miss
          if (internetConnection) {
            try {
              const yearly = await getYearlyPrayerTimes(location, currentYear);

              set({
                yearlyPrayerTimes: yearly,
                fetchedYear: currentYear,
                prayerTimes: yearly[todayKey] ?? null,
                lastFetchedDate: new Date().toLocaleString('en-GB'),
                prayersOutdated: false,
              });

              console.log('🌐 [prayersStore] Yearly prayer times fetched&loaded from API');
              return;
            } catch (err) {
              console.warn("⚠️ Failed to fetch yearly prayer times:", err);
              Sentry.captureException(err);
            }
          }

          // OFFLINE: Fallback to saved data if fetch failed
          if (yearlyPrayerTimes) {
            set({
              prayerTimes: yearlyPrayerTimes[todayKey] ?? null,
              prayersOutdated: fetchedYear !== currentYear,
            });
            console.log('💾 [prayersStore] Offline — using stored yearly data');
            return;
          }


          // No data at all
          set({
            prayerTimes: null,
            prayersError: !internetConnection ? tr.labels.noInternet : tr.labels.prayersError,
          });

        } catch (err: any) {
          console.warn("⚠️ Failed to load prayer times:", err);
          Sentry.captureException(err);
          set({ prayersError: err.message || "An unexpected error occurred." });
        } finally {
          set({ isLoading: false });
        }
      },

      // Reload prayer times (requests location first, then fetches fresh yearly data)
      reloadPrayerTimes: async () => {
        set({ isLoading: true });

        const tr = useLanguageStore.getState().tr;

        try {
          const newLocation = await getUserLocation(tr);

          if (!newLocation) {
            console.log("📍 [prayersStore] Location denied or unavailable, cannot load prayer times");
            return;
          }

          if (!hasLocationChanged(useLocationStore.getState(), newLocation)) {
            console.log('📍 [prayersStore] Location unchanged — skipping save');
          } else {
            useLocationStore.getState().setLocation(
              newLocation.location,
              newLocation.fullAddress,
              newLocation.timeZone
            );
            console.log("📍 [prayersStore] Location updated to:", newLocation.location);
          }

          // Force fresh yearly fetch
          set({ fetchedYear: null });
          await get().loadPrayerTimes();

        } catch (err) {
          console.error('❌ [prayersStore] Location error:', err);
          Sentry.captureException(err);
          set({ prayersError: tr.labels.locationError });
        } finally {
          set({ isLoading: false });
        }
      },

      // Used by prayerTimings modal for offline date explorer
      getPrayerTimesForDate: async (dateKey: string) => {
        return get().yearlyPrayerTimes?.[dateKey] ?? null;
      },

    }),
    {
      name: 'prayers-storage-v2',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        prayerTimes: state.prayerTimes,
        lastFetchedDate: state.lastFetchedDate,
        yearlyPrayerTimes: state.yearlyPrayerTimes,
        fetchedYear: state.fetchedYear,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isReady = true;
        }
      },
    }
  )
);