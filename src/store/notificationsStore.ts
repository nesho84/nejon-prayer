import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mmkvStorage } from '@/store/storage';
import { scheduleNotificationsService } from '@/services/notificationsService';
import { useLanguageStore } from '@/store/languageStore';
import { useDeviceSettingsStore } from '@/store/deviceSettingsStore';
import {
  PrayerType,
  EventPrayerType,
  SpecialType,
  NotifSettings,
  PrayerSettings,
  EventSettings,
  SpecialSettings
} from '@/types/notification.types';
import { PrayerTimes } from '@/types/prayer.types';
import { usePrayersStore } from './prayersStore';

interface NotificationsState {
  notifSettings: NotifSettings;
  prayers: Record<PrayerType, PrayerSettings>;
  events: Record<EventPrayerType, EventSettings>;
  special: Record<SpecialType, SpecialSettings>;
  lastScheduledHash: string | null;
  isLoading: boolean;
  isReady: boolean;
  setSettings: (updates: Partial<NotifSettings>) => void;
  setPrayer: (prayer: PrayerType, enabled: boolean, offset?: number, sound?: string) => void;
  setEvent: (event: EventPrayerType, enabled: boolean, offset?: number) => void;
  setSpecial: (special: SpecialType, enabled: boolean) => void;
  scheduleNotifications: (prayerTimes?: PrayerTimes | null) => Promise<void>;
}

const DEFAULT_NOTIF_SETTINGS: NotifSettings = {
  volume: 1.0,
  vibration: 'on',
  snooze: 5,
};

const DEFAULT_PRAYERS: Record<PrayerType, PrayerSettings> = {
  Fajr: { enabled: true, offset: -15, sound: 'azan1.mp3' },
  Dhuhr: { enabled: true, offset: 0, sound: 'azan1.mp3' },
  Asr: { enabled: true, offset: 0, sound: 'azan1.mp3' },
  Maghrib: { enabled: true, offset: 0, sound: 'azan1.mp3' },
  Isha: { enabled: true, offset: 0, sound: 'azan1.mp3' },
};

const DEFAULT_EVENTS: Record<EventPrayerType, EventSettings> = {
  Imsak: { enabled: false, offset: 0 },
  Sunrise: { enabled: false, offset: 0 },
};

const DEFAULT_SPECIAL: Record<SpecialType, SpecialSettings> = {
  Friday: { enabled: true },
  Ramadan: { enabled: false },
  Eid: { enabled: false },
};

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      notifSettings: DEFAULT_NOTIF_SETTINGS,
      prayers: DEFAULT_PRAYERS,
      events: DEFAULT_EVENTS,
      special: DEFAULT_SPECIAL,
      lastScheduledHash: null,
      isLoading: false,
      isReady: false,

      // Update notifications settings (volume, vibration, snooze)
      setSettings: (updates) => {
        set((state) => ({
          notifSettings: { ...state.notifSettings, ...updates },
        }));

        get().scheduleNotifications();
      },

      // Update individual prayer settings
      setPrayer: (prayer, enabled, offset, sound) => {
        set((state) => ({
          prayers: {
            ...state.prayers,
            [prayer]: {
              enabled,
              offset: offset ?? state.prayers[prayer].offset,
              sound: sound ?? state.prayers[prayer].sound,
            },
          },
        }));

        get().scheduleNotifications();
      },

      // Update individual event settings
      setEvent: (event, enabled, offset) => {
        set((state) => ({
          events: {
            ...state.events,
            [event]: {
              enabled,
              offset: offset ?? state.events[event].offset,
            },
          },
        }));

        get().scheduleNotifications();
      },

      // Update individual special notification settings
      setSpecial: (special, enabled) => {
        set((state) => ({
          special: {
            ...state.special,
            [special]: { enabled },
          },
        }));

        get().scheduleNotifications();
      },

      // Main scheduling function
      scheduleNotifications: async () => {
        // Pull fresh data from other stores using getState()
        const prayerTimes = usePrayersStore.getState().prayerTimes;
        const language = useLanguageStore.getState().language;
        const tr = useLanguageStore.getState().tr;
        const { notifSettings, prayers, events, special } = get();

        // Check if prayerTimes is available
        if (!prayerTimes) {
          console.warn('⚠️ Cannot schedule notifications: Prayer times not available');
          return;
        }

        // 1. Calculate current state hash
        const currentHash = JSON.stringify({
          prayerTimes,
          prayers,
          events,
          special,
          language,
          volume: notifSettings.volume,
          vibration: notifSettings.vibration,
        });

        // 2. Compare with last hash
        if (get().lastScheduledHash === currentHash) {
          console.log('⏸️ [notificationsStore] Notification unchanged, skipping reschedule');
          return;
        }

        set({ isLoading: true });

        try {
          // 3. Call service to schedule notifications with current settings and prayer times
          await scheduleNotificationsService({
            prayerTimes,
            settings: { notifSettings, prayers, events, special },
            language,
            tr
          });

          // 4. Save hash after successful scheduling
          set({ lastScheduledHash: currentHash });
        } catch (error) {
          console.error('❌ Failed to schedule notifications:', error);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'notifications-storage',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        notifSettings: state.notifSettings,
        prayers: state.prayers,
        events: state.events,
        special: state.special,
        lastScheduledHash: state.lastScheduledHash,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isReady = true;
        }
      },
    }
  )
);