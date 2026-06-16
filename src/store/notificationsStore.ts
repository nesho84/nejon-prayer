import { SOUNDS } from '@/constants/sounds';
import { scheduleNotificationsService } from '@/services/notificationsService';
import { useDeviceSettingsStore } from '@/store/deviceSettingsStore';
import { useLanguageStore } from '@/store/languageStore';
import { usePrayersStore } from '@/store/prayersStore';
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
import { toDateKey } from '@/utils/date';
import * as Sentry from '@sentry/react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useHolidaysStore } from './holidaysStore';

interface NotificationsState {
  notifSettings: NotifSettings;
  prayers: Record<PrayerType, PrayerSettings>;
  events: Record<PrayerEventType, EventSettings>;
  specials: Record<SpecialType, SpecialSettings>;
  lastScheduledHash: string | null;
  lastBackgroundSync: string | null;
  isLoading: boolean;
  isReady: boolean;
  syncNotifications: (prayerTimes?: PrayerTimes | null) => Promise<void>;
  syncNotificationsInBackground: () => Promise<void>;
  setSettings: (updates: Partial<NotifSettings>) => void;
  setPrayer: (prayer: PrayerType, updates: Partial<PrayerSettings>) => void;
  setEvent: (event: PrayerEventType, updates: Partial<EventSettings>) => void;
  setSpecial: (special: SpecialType, updates: Partial<SpecialSettings>) => void;
}

const DEFAULT_NOTIFICATIONS_SETTINGS: NotifSettings = {
  volume: 0.1,
  vibration: 'short',
  snooze: 5,
};

const DEFAULT_PRAYER_SETTINGS: Record<PrayerType, PrayerSettings> = {
  Fajr: { enabled: true, offset: -10, sound: SOUNDS.azan2_fajr },
  Dhuhr: { enabled: true, offset: 0, sound: SOUNDS.azan1_short },
  Asr: { enabled: true, offset: 0, sound: SOUNDS.azan1_short },
  Maghrib: { enabled: true, offset: 0, sound: SOUNDS.azan1_short },
  Isha: { enabled: true, offset: 0, sound: SOUNDS.azan1_short },
};

const DEFAULT_EVENT_SETTINGS: Record<PrayerEventType, EventSettings> = {
  Imsak: { enabled: false, offset: 0, sound: SOUNDS.alarm1 },
  Sunrise: { enabled: false, offset: 0, sound: SOUNDS.alarm1 },
};

const DEFAULT_SPECIAL_SETTINGS: Record<SpecialType, SpecialSettings> = {
  Friday: { enabled: true },
  DailyQuote: { enabled: true },
  Holidays: { enabled: true },
};

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      notifSettings: DEFAULT_NOTIFICATIONS_SETTINGS,
      prayers: DEFAULT_PRAYER_SETTINGS,
      events: DEFAULT_EVENT_SETTINGS,
      specials: DEFAULT_SPECIAL_SETTINGS,
      lastScheduledHash: null,
      lastBackgroundSync: null,
      isLoading: false,
      isReady: false,

      // Main scheduling function in the store (called in useNotificationsSync)
      syncNotifications: async () => {
        // Pull fresh data from other stores using getState()
        const notificationPermission = useDeviceSettingsStore.getState().notificationPermission;
        const prayerTimes = usePrayersStore.getState().prayerTimes;
        const yearlyPrayerTimes = usePrayersStore.getState().yearlyPrayerTimes;
        const yearlyHolidays = useHolidaysStore.getState().yearlyHolidays;
        const language = useLanguageStore.getState().language;
        const tr = useLanguageStore.getState().tr;

        // Extract current notification settings
        const { notifSettings, prayers, events, specials } = get();

        // Tomorrow's prayer times — used for correct scheduling of already-passed prayers
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowPrayerTimes = yearlyPrayerTimes?.[toDateKey(tomorrow)] ?? null;

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
          specials,
          yearlyHolidays,
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

        // Log the reason for rescheduling with context (e.g. Dhuhr time changed, or user updated settings)
        Sentry.addBreadcrumb({
          category: 'notifications',
          message: 'Notifications rescheduled',
          level: 'info',
          data: {
            at: new Date().toISOString(),
            prayerTimes,
          },
        });

        set({ isLoading: true });

        try {
          // 3. Call service to schedule notifications with current settings and prayer times
          await scheduleNotificationsService({
            prayerTimes,
            tomorrowPrayerTimes,
            yearlyHolidays,
            config: { notifSettings, prayers, events, specials },
            language,
            tr
          });

          // 4. Save hash after successful scheduling
          set({ lastScheduledHash: currentHash });
        } catch (err) {
          console.error('❌ Failed to schedule notifications:', err);
          Sentry.captureException(err);
        } finally {
          set({ isLoading: false });
        }
      },

      // Sync background notifications (called in root index.ts on background event)
      syncNotificationsInBackground: async () => {
        try {
          console.log('🔄 [Background] Syncing Notifications...');

          // Check if we already updated today
          const today = toDateKey();
          const lastUpdate = get().lastBackgroundSync;

          if (lastUpdate === today) {
            console.log('⏸️ [Background] Already updated today, skipping sync');
            return;
          }

          // Load today's prayer times from yearly cache
          await usePrayersStore.getState().loadPrayerTimes();
          // Sync notifications (hash will prevent unnecessary reschedule)
          await get().syncNotifications();

          // Mark update complete for today
          set({ lastBackgroundSync: today });

          // Always send to Sentry so we can audit background scheduling even when no error occurs
          Sentry.captureMessage('[Background] Notifications synced', {
            level: 'info',
            extra: {
              at: new Date().toISOString(),
              prayerTimes: usePrayersStore.getState().prayerTimes,
            },
          });

          console.log('✅ [Background] Notifications synced successfully');
        } catch (error) {
          console.error('❌ [Background] Notifications sync failed:', error);
        }
      },

      // Update notifications settings (volume, vibration, snooze)
      setSettings: (updates) => {
        set((state) => ({
          notifSettings: { ...state.notifSettings, ...updates },
        }));
        get().syncNotifications();
      },

      // Update prayers notification settings
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

      // Update events notification settings
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

      // Update specials notification settings
      setSpecial: (special, updates) => {
        set((state) => ({
          specials: {
            ...state.specials,
            [special]: {
              ...state.specials[special],
              ...updates,
            },
          },
        }));
        get().syncNotifications();
      },
    }),
    {
      name: 'notifications-storage-v2',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        notifSettings: state.notifSettings,
        prayers: state.prayers,
        events: state.events,
        specials: state.specials,
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