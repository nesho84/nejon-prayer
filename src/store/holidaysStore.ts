import { fetchHolidayDates } from '@/services/holidaysService';
import { useDeviceSettingsStore } from '@/store/deviceSettingsStore';
import { mmkvStorage } from '@/store/storage';
import { HolidayDates } from '@/types/holiday.types';
import * as Sentry from '@sentry/react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface HolidaysState {
  holidayDates: HolidayDates | null;
  fetchedYear: number | null;
  isLoading: boolean;
  isReady: boolean;
  loadHolidays: () => Promise<void>;
}

export const useHolidaysStore = create<HolidaysState>()(
  persist(
    (set, get) => ({
      holidayDates: null,
      fetchedYear: null,
      isLoading: false,
      isReady: false,

      // Load Islamic holiday Gregorian dates — called once per year
      loadHolidays: async () => {
        try {
          const internetConnection = useDeviceSettingsStore.getState().internetConnection;

          // Compute current year
          const now = new Date();
          const currentYear = now.getFullYear();

          const { holidayDates, fetchedYear } = get();

          // Already fetched for this year — skip
          if (holidayDates && fetchedYear === currentYear) {
            console.log('💾 [holidaysStore] Islamic Holidays loaded from storage ');
            return;
          }

          // OFFLINE: No internet connection — use cached data if available
          if (!internetConnection) {
            console.log('💾 [holidaysStore] Offline — using storage holiday dates');
            return;
          }

          // Slow path: need a network fetch — show loading indicator
          set({ isLoading: true });

          // ONLINE: Need to fetch — first time, new year, or cache miss
          try {
            const dates = await fetchHolidayDates();

            set({
              holidayDates: dates,
              fetchedYear: currentYear,
            });

            console.log('🌐 [holidaysStore] Islamic holiday dates fetched & stored');
          } catch (err) {
            console.warn('⚠️ [holidaysStore] Failed to fetch Islamic holiday dates:', err);
            Sentry.captureException(err);
          }

        } catch (err: unknown) {
          console.warn('❌ [holidaysStore] Failed to load holidays:', err);
          Sentry.captureException(err);
        } finally {
          set({ isLoading: false });
        }
      },

    }),
    {
      name: 'holidays-storage-v1',
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