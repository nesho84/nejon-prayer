import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './storage';
import { useLocationStore } from './locationStore';
import { useLanguageStore } from './languageStore';
import { useDeviceSettingsStore } from './deviceSettingsStore';
// import { useNotificationsStore } from './notificationsStore';
import { getPrayerTimes } from '@/services/prayersService';
import { getUserLocation, hasLocationChanged } from '@/services/locationService';
import { PrayerTimes } from '@/types/prayer.types';

const STALE_DAYS = 3;

interface PrayersState {
  prayerTimes: PrayerTimes | null;
  prayersError: string | null;
  prayersOutdated: boolean;
  isLoading: boolean;
  lastFetchedDate: string | null;
  loadPrayerTimes: () => Promise<void>;
  reloadPrayerTimes: () => Promise<void>;
}

export const usePrayersStore = create<PrayersState>()(
  persist(
    (set, get) => ({
      prayerTimes: null,
      prayersError: null,
      prayersOutdated: false,
      isLoading: false,
      lastFetchedDate: null,

      // Load prayer times (uses existing location)
      loadPrayerTimes: async () => {
        set({ isLoading: true, prayersError: null, prayersOutdated: false });

        try {
          const { location } = useLocationStore.getState();
          const { internetConnection, notificationPermission } = useDeviceSettingsStore.getState();
          const { tr } = useLanguageStore.getState();

          // Validate location first
          if (!location) {
            set({ prayerTimes: null, prayersError: tr.labels.locationSet });
            return;
          }

          // ONLINE: fetch from API (always fetch when online)
          if (internetConnection) {
            try {
              const timings = await getPrayerTimes(location);

              if (timings) {
                const lastFetched = new Date().toLocaleString('en-GB');
                const currentTimes = get().prayerTimes;
                const timesChanged = JSON.stringify(currentTimes) !== JSON.stringify(timings);

                set({
                  prayerTimes: timings,
                  lastFetchedDate: lastFetched,
                  prayersOutdated: false
                });

                console.log('🌐 Prayer times loaded from API');

                // Only reschedule if changed
                if (timesChanged) {
                  if (notificationPermission) {
                    console.log('🔔 Prayer times changed, rescheduling notifications...[not implemented yet!]');
                    // @TODO: <-- when notifications store is implemented
                    // await useNotificationsStore.getState().scheduleNotifications();
                  }
                }

                return; // Exit early
              }
            } catch (err) {
              console.warn("⚠️ Failed to fetch prayer times from API:", err);
            }
          }

          // OFFLINE: Fallback to saved data if fetch failed
          const savedTimes = get().prayerTimes;
          const lastFetched = get().lastFetchedDate;
          if (savedTimes) {
            console.log('💾 Using storage prayer times');

            // Check if outdated EVERY time we use storage
            let isOutdated = false;
            if (lastFetched) {
              const timestamp = new Date(lastFetched).getTime();
              const daysDiff = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
              isOutdated = daysDiff > STALE_DAYS;
            }

            set({ prayersOutdated: isOutdated });

            if (isOutdated) {
              console.log(`⚠️ Saved prayer times are outdated (>${STALE_DAYS} days old)`);
            }

            return; // Exit early
          }

          // NO DATA: no online, no saved
          set({
            prayerTimes: null,
            prayersError: !internetConnection ? tr.labels.noInternet : tr.labels.prayersError
          });

        } catch (err: any) {
          console.warn("⚠️ Failed to load prayer times:", err);
          set({ prayersError: err.message || "An unexpected error occurred." });
        } finally {
          set({ isLoading: false });
        }
      },

      // Reload prayer times (requests location first, then loads)
      reloadPrayerTimes: async () => {
        set({ isLoading: true });

        const { tr } = useLanguageStore.getState();

        try {
          // Get fresh location
          const newLocation = await getUserLocation(tr);

          if (!newLocation) {
            console.log("📍 [prayersStore] Location denied or unavailable, cannot load prayers");
            return;
          }

          // Check for location changes, before updating state
          if (!hasLocationChanged(useLocationStore.getState(), newLocation)) {
            console.log('📍 [prayersStore] Location unchanged — skipping save');
          } else {
            // Update locationStore
            useLocationStore.getState().setLocation(
              newLocation.location,
              newLocation.fullAddress,
              newLocation.timeZone
            );
            console.log("📍 [prayersStore] Location updated to:", newLocation.location);
          }

          await get().loadPrayerTimes();

        } catch (err) {
          console.error('❌ [prayersStore] Location error:', err);
          set({ prayersError: tr.labels.locationError });
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'prayers-storage',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        prayerTimes: state.prayerTimes,
        lastFetchedDate: state.lastFetchedDate,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.lastFetchedDate) {
          // Check if prayers are outdated again
          const timestamp = new Date(state.lastFetchedDate).getTime();
          const daysDiff = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
          state.prayersOutdated = daysDiff > STALE_DAYS;

          state.isLoading = false;
        }
      },
    }
  )
);