import { mmkvStorage } from '@/store/storage';
import { MAIN_PRAYERS, PrayerName } from '@/types/prayer.types';
import { toDateKey } from '@/utils/datetime';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type DayTracking = Partial<Record<PrayerName, 'prayed' | null>>;
type TrackingRecord = Record<string, DayTracking>;

interface PrayersTrackingState {
  tracking: TrackingRecord;
  isReady: boolean;
  celebratedDate: string | null;
  markPrayed: (prayer: PrayerName, dateKey?: string) => Promise<boolean>;
  unmarkPrayed: (prayer: PrayerName, dateKey?: string) => void;
  setCelebrated: (dateKey: string) => void;
}

// Keep tracking data for 37 days to prevent infinite growth of storage
const KEEP_DAYS = 37;

// Remove entries older than KEEP_DAYS from the tracking record
export const cleanOldEntries = (tracking: TrackingRecord): TrackingRecord => {
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
    (set, get) => ({
      tracking: {},
      isReady: false,
      celebratedDate: null,

      markPrayed: async (prayer, dateKey) => {
        const key = dateKey ?? toDateKey();
        set((state) => ({
          tracking: {
            ...state.tracking,
            [key]: { ...state.tracking[key], [prayer]: 'prayed' },
          },
        }));
        // Returns whether all prayers are done for that day.
        // Return value is optional — callers that don't need it can ignore it.
        const { tracking } = get();
        const isToday = key === toDateKey();
        const allDone = MAIN_PRAYERS.every((p) => tracking[key]?.[p] === 'prayed');
        return isToday && allDone;
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

      setCelebrated: (dateKey) => set({ celebratedDate: dateKey }),
    }),
    {
      name: 'prayer-tracking-storage',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        tracking: state.tracking,
        celebratedDate: state.celebratedDate,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.tracking = cleanOldEntries(state.tracking);
          state.isReady = true;
        }
      },
    }
  )
);