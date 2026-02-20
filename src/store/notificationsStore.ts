import { SOUNDS } from '@/constants/sounds';
import { scheduleNotificationsService } from '@/services/notificationsService';
import { useLanguageStore } from '@/store/languageStore';
import { mmkvStorage } from '@/store/storage';
import {
  EventSettings,
  NotifSettings,
  PrayerEventType,
  PrayerSettings,
  PrayerType,
  SpecialSettings,
  SpecialType
} from '@/types/notification.types';
import { PrayerTimes } from '@/types/prayer.types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useDeviceSettingsStore } from './deviceSettingsStore';
import { usePrayersStore } from './prayersStore';

interface NotificationsState {
  notifSettings: NotifSettings;
  prayers: Record<PrayerType, PrayerSettings>;
  events: Record<PrayerEventType, EventSettings>;
  special: Record<SpecialType, SpecialSettings>;
  lastScheduledHash: string | null;
  isLoading: boolean;
  isReady: boolean;
  setSettings: (updates: Partial<NotifSettings>) => void;
  setPrayer: (prayer: PrayerType, updates: Partial<PrayerSettings>) => void;
  setEvent: (event: PrayerEventType, updates: Partial<EventSettings>) => void;
  setSpecial: (special: SpecialType, updates: Partial<SpecialSettings>) => void;
  syncNotifications: (prayerTimes?: PrayerTimes | null) => Promise<void>;
}

const DEFAULT_NOTIF_SETTINGS: NotifSettings = {
  volume: 0.5,
  vibration: 'on',
  snooze: 5,
};

const DEFAULT_PRAYERS: Record<PrayerType, PrayerSettings> = {
  Fajr: { enabled: true, offset: -15, sound: SOUNDS.azan1_short },
  Dhuhr: { enabled: true, offset: 0, sound: SOUNDS.azan1_short },
  Asr: { enabled: true, offset: 0, sound: SOUNDS.azan1_short },
  Maghrib: { enabled: true, offset: 0, sound: SOUNDS.azan1_short },
  Isha: { enabled: true, offset: 0, sound: SOUNDS.azan1_short },
};

const DEFAULT_EVENTS: Record<PrayerEventType, EventSettings> = {
  Imsak: { enabled: false, offset: 0, sound: SOUNDS.alarm1 },
  Sunrise: { enabled: false, offset: 0, sound: SOUNDS.alarm1 },
};

const DEFAULT_SPECIAL: Record<SpecialType, SpecialSettings> = {
  Friday: { enabled: true },
  DailyQuote: { enabled: true },
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
        get().syncNotifications();
      },

      // Update individual prayer settings
      setPrayer: (prayer, updates) => {
        set((state) => ({
          prayers: {
            ...state.prayers,
            [prayer]: {
              ...state.prayers[prayer],
              ...updates,
            },
          },
        }));
        get().syncNotifications();
      },

      // Update individual event settings
      setEvent: (event, updates) => {
        set((state) => ({
          events: {
            ...state.events,
            [event]: {
              ...state.events[event],
              ...updates,
            },
          },
        }));
        get().syncNotifications();
      },

      // Update individual special notification settings
      setSpecial: (special, updates) => {
        set((state) => ({
          special: {
            ...state.special,
            [special]: {
              ...state.special[special],
              ...updates,
            },
          },
        }));
        get().syncNotifications();
      },

      // Main scheduling function
      syncNotifications: async () => {
        // Pull fresh data from other stores using getState()
        const notificationPermission = useDeviceSettingsStore.getState().notificationPermission;
        const prayerTimes = usePrayersStore.getState().prayerTimes;
        const language = useLanguageStore.getState().language;
        const tr = useLanguageStore.getState().tr;

        // Extract current notification settings
        const { notifSettings, prayers, events, special } = get();

        // Check if prayerTimes are available
        if (!notificationPermission || !prayerTimes) {
          console.warn('⚠️  Cannot schedule notifications: Missing notification permission or prayer times');
          return;
        }

        // 1. Create a hash of current settings
        const currentHash = JSON.stringify({
          prayerTimes,
          prayers,
          events,
          special,
          language,
          volume: notifSettings.volume,
          vibration: notifSettings.vibration,
          snooze: notifSettings.snooze
        });

        // 2. Compare with last scheduled hash to avoid unnecessary rescheduling
        if (get().lastScheduledHash === currentHash) {
          console.log('⏸️ [notificationsStore] Notification unchanged, skipping reschedule');
          return;
        }

        set({ isLoading: true });

        try {
          // 3. Call service to schedule notifications with current settings and prayer times
          await scheduleNotificationsService({
            prayerTimes,
            config: { notifSettings, prayers, events, special },
            language,
            tr
          });

          // 4. Save hash after successful scheduling
          set({ lastScheduledHash: currentHash });
        } catch (err) {
          console.error('❌ Failed to schedule notifications:', err);
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