import { fetchIslamicHolidayDates } from '@/services/islamicHolidaysService';
import { useDeviceSettingsStore } from '@/store/deviceSettingsStore';
import { mmkvStorage } from '@/store/storage';
import { IslamicHolidayDates } from '@/types/islamic-holidays.types';
import * as Sentry from '@sentry/react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface IslamicHolidaysState {
  holidayDates: IslamicHolidayDates | null;
  fetchedYear: number | null;
  isLoading: boolean;
  isReady: boolean;
  loadIslamicHolidays: () => Promise<void>;
}

export const useIslamicHolidaysStore = create<IslamicHolidaysState>()(
  persist(
    (set, get) => ({
      holidayDates: null,
      fetchedYear: null,
      isLoading: false,
      isReady: false,

      // Load Islamic holiday Gregorian dates — called once per year
      loadIslamicHolidays: async () => {
        const currentYear = new Date().getFullYear();
        const internetConnection = useDeviceSettingsStore.getState().internetConnection;

        // Already fetched for this year — skip
        if (get().fetchedYear === currentYear) {
          console.log('💾 [islamicHolidaysStore] Islamic Holidays loaded from storage ');
          return;
        }

        // OFFLINE: No internet connection — use cached data if available
        if (!internetConnection) {
          console.log('💾 [islamicHolidaysStore] Offline — using storage holiday dates');
          return;
        }

        // Slow path: need a network fetch — show loading indicator
        set({ isLoading: true });

        // ONLINE: Need to fetch — first time, new year, or cache miss
        try {
          const holidayDates = await fetchIslamicHolidayDates();

          set({
            holidayDates,
            fetchedYear: currentYear,
          });

          console.log('🌐 [islamicHolidaysStore] Islamic holiday dates fetched & stored');
        } catch (err) {
          console.warn('❌ [islamicHolidaysStore] Failed to fetch Islamic holiday dates:', err);
          Sentry.captureException(err);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'islamic-holidays-storage-v1',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        holidayDates: state.holidayDates,
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