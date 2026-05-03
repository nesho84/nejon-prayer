import { mmkvStorage } from '@/store/storage';
import { PrayerName } from '@/types/prayer.types';
import { formatDateKey } from '@/utils/date';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type TrackingRecord = Record<string, 'prayed' | null>;

interface PrayersTrackingState {
  tracking: TrackingRecord;
  isReady: boolean;
  markPrayed: (prayer: PrayerName, dateKey?: string) => void;
  unmarkPrayed: (prayer: PrayerName) => void;
}

// Keep tracking data for 30 days to prevent infinite growth of storage
const KEEP_DAYS = 30;

// Local date key format: YYYY-MM-DD
const getDateKey = formatDateKey;

// Remove entries older than KEEP_DAYS from the tracking record
const cleanOldEntries = (tracking: TrackingRecord): TrackingRecord => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - KEEP_DAYS);
  const cutoffKey = getDateKey(cutoff);

  const cleaned: TrackingRecord = {};
  for (const key in tracking) {
    const [datePart] = key.split(':');
    if (datePart >= cutoffKey) {
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

      markPrayed: (prayer, dateKey?: string) => {
        const key = `${dateKey ?? getDateKey()}:${prayer}`;
        set((state) => ({
          tracking: { ...state.tracking, [key]: 'prayed' },
        }));
      },

      unmarkPrayed: (prayer) => {
        const key = `${getDateKey()}:${prayer}`;
        set((state) => ({
          tracking: { ...state.tracking, [key]: null },
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