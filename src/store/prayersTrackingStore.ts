import { mmkvStorage } from '@/store/storage';
import { MAIN_PRAYERS, PrayerName } from '@/types/prayer.types';
import { toDateKey } from '@/utils/datetime';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Where a mark/unmark originated — key diagnostic for wrong-date / headless-JS bugs
type MarkSource = 'home' | 'calendar' | 'notif-fg' | 'notif-bg' | 'unknown';

// Per-prayer entry: status plus trace metadata (absent key = never touched)
interface PrayerMark {
  status: 'prayed' | null;    // same meaning as the old bare string; null = unmarked
  markedAt: string | null;    // en-GB formatted timestamp of last mark
  unmarkedAt: string | null;  // en-GB formatted timestamp of last unmark (kept after re-mark)
  source: MarkSource;         // origin of the last action
  toggles: number;            // count of mark+unmark actions on this prayer/day
}

type DayTracking = Partial<Record<PrayerName, PrayerMark>>;
type TrackingRecord = Record<string, DayTracking>;

interface PrayersTrackingState {
  tracking: TrackingRecord;
  isReady: boolean;
  celebratedDate: string | null;
  markPrayed: (prayer: PrayerName, dateKey?: string, source?: MarkSource) => Promise<boolean>;
  unmarkPrayed: (prayer: PrayerName, dateKey?: string, source?: MarkSource) => void;
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

      markPrayed: async (prayer, dateKey, source = 'unknown') => {
        const key = dateKey ?? toDateKey();
        set((state) => {
          const prev = state.tracking[key]?.[prayer];
          const mark: PrayerMark = {
            status: 'prayed',
            markedAt: new Date().toLocaleString('en-GB'),
            unmarkedAt: prev?.unmarkedAt ?? null,
            source,
            toggles: (prev?.toggles ?? 0) + 1,
          };
          return { tracking: { ...state.tracking, [key]: { ...state.tracking[key], [prayer]: mark } } };
        });
        // Returns whether all prayers are done for that day.
        // Return value is optional — callers that don't need it can ignore it.
        const { tracking } = get();
        const isToday = key === toDateKey();
        const allDone = MAIN_PRAYERS.every((p) => tracking[key]?.[p]?.status === 'prayed');
        return isToday && allDone;
      },

      unmarkPrayed: (prayer, dateKey, source = 'unknown') => {
        const key = dateKey ?? toDateKey();
        set((state) => {
          const prev = state.tracking[key]?.[prayer];
          const mark: PrayerMark = {
            status: null,
            markedAt: prev?.markedAt ?? null,
            unmarkedAt: new Date().toLocaleString('en-GB'),
            source,
            toggles: (prev?.toggles ?? 0) + 1,
          };
          return { tracking: { ...state.tracking, [key]: { ...state.tracking[key], [prayer]: mark } } };
        });
      },

      setCelebrated: (dateKey) => set({ celebratedDate: dateKey }),
    }),
    {
      name: 'prayer-tracking-storage-v2',
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
