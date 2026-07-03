import { getYearlyHolidays } from '@/services/holidaysService';
import { useDeviceSettingsStore } from '@/store/deviceSettingsStore';
import { mmkvStorage } from '@/store/storage';
import { YearlyHolidays } from '@/types/holiday.types';
import * as Sentry from '@sentry/react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface HolidaysState {
  yearlyHolidays: YearlyHolidays | null;
  fetchedYear: number | null;
  isLoading: boolean;
  isReady: boolean;
  loadHolidays: () => Promise<void>;
}

export const useHolidaysStore = create<HolidaysState>()(
  persist(
    (set, get) => ({
      yearlyHolidays: null,
      fetchedYear: null,
      isLoading: false,
      isReady: false,

      // Load all known holidays for current + next Hijri year — once per year
      loadHolidays: async () => {
        try {
          const internetConnection = useDeviceSettingsStore.getState().internetConnection;

          // Compute current year
          const now = new Date();
          const currentYear = now.getFullYear();

          const { yearlyHolidays, fetchedYear } = get();

          // Already fetched for this year — skip
          if (yearlyHolidays && fetchedYear === currentYear) {
            console.log('💾 [holidaysStore] Holidays loaded from storage');
            return;
          }

          // OFFLINE: No internet connection — use cached data if available
          if (!internetConnection) {
            console.log('💾 [holidaysStore] Offline — using storage holidays');
            return;
          }

          // Slow path: need a network fetch — show loading indicator
          set({ isLoading: true });

          // ONLINE: Need to fetch — first time, new year, or cache miss
          try {
            const { holidays, complete } = await getYearlyHolidays();

            set({
              yearlyHolidays: holidays,
              // Only lock the year on a complete fetch; partial results stay
              // visible but trigger a refetch on the next launch
              fetchedYear: complete ? currentYear : null,
            });

            console.log('🌐 [holidaysStore] Yearly holidays fetched & stored');
          } catch (err) {
            console.warn('⚠️ [holidaysStore] Failed to fetch yearly holidays:', err);
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
      name: 'holidays-storage-v2',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        yearlyHolidays: state.yearlyHolidays,
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