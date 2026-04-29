import { mmkvStorage } from '@/store/storage';
import { PrayerName } from '@/types/prayer.types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type TrackingRecord = Record<string, 'prayed' | null>;

interface PrayerTrackingState {
  tracking: TrackingRecord;
  isReady: boolean;
  markPrayed: (prayer: PrayerName, date?: string) => void;
  unmarkPrayed: (prayer: PrayerName) => void;
  getTodayStatus: (prayer: PrayerName) => 'prayed' | null;
}

export const usePrayerTrackingStore = create<PrayerTrackingState>()(
  persist(
    (set, get) => ({
      tracking: {},
      isReady: false,

      markPrayed: (prayer, date?) => {
        const key = `${date ?? new Date().toISOString().split('T')[0]}:${prayer}`;
        set((state) => ({
          tracking: { ...state.tracking, [key]: 'prayed' },
        }));
      },

      unmarkPrayed: (prayer) => {
        const key = `${new Date().toISOString().split('T')[0]}:${prayer}`;
        set((state) => ({
          tracking: { ...state.tracking, [key]: null },
        }));
      },

      getTodayStatus: (prayer) => {
        const key = `${new Date().toISOString().split('T')[0]}:${prayer}`;
        return get().tracking[key] ?? null;
      },
    }),
    {
      name: 'prayer-tracking-storage',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({ tracking: state.tracking }),
      onRehydrateStorage: () => (state) => {
        if (state) state.isReady = true;
      },
    }
  )
);