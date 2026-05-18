import { mmkvStorage } from '@/store/storage';
import { PrayerName } from '@/types/prayer.types';
import { toDateKey } from '@/utils/date';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type DayTracking = Partial<Record<PrayerName, 'prayed' | null>>;
type TrackingRecord = Record<string, DayTracking>;

interface PrayersTrackingState {
  tracking: TrackingRecord;
  isReady: boolean;
  markPrayed: (prayer: PrayerName, dateKey?: string) => void;
  unmarkPrayed: (prayer: PrayerName, dateKey?: string) => void;
}

// Keep tracking data for 31 days to prevent infinite growth of storage
const KEEP_DAYS = 31;

// Remove entries older than KEEP_DAYS from the tracking record
const cleanOldEntries = (tracking: TrackingRecord): TrackingRecord => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - KEEP_DAYS);
  const cutoffKey = toDateKey(cutoff);

  const cleaned: TrackingRecord = {};
  for (const key in tracking) {
    if (key >= cutoffKey) {
      cleaned[key] = tracking[key];
    }
  }
  return cleaned;
};

export const usePrayersTrackingStore = create<PrayersTrackingState>()(
  persist(
    (set) => ({
      tracking: {},
      isReady: false,

      markPrayed: (prayer, dateKey) => {
        const key = dateKey ?? toDateKey();
        set((state) => ({
          tracking: {
            ...state.tracking,
            [key]: { ...state.tracking[key], [prayer]: 'prayed' },
          },
        }));
      },

      unmarkPrayed: (prayer, dateKey) => {
        const key = dateKey ?? toDateKey();
        set((state) => ({
          tracking: {
            ...state.tracking,
            [key]: { ...state.tracking[key], [prayer]: null },
          },
        }));
      },
    }),
    {
      name: 'prayer-tracking-storage',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({ tracking: state.tracking }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.tracking = cleanOldEntries(state.tracking);
          state.isReady = true;
        }
      },
    }
  )
);