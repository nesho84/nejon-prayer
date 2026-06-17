import { createNotificationsChannels, handleNotificationEvent } from '@/services/notificationsService';
import { useDeviceSettingsStore } from '@/store/deviceSettingsStore';
import { useHolidaysStore } from '@/store/holidaysStore';
import { useLanguageStore } from '@/store/languageStore';
import { useNotificationsStore } from '@/store/notificationsStore';
import { usePrayersStore } from '@/store/prayersStore';
import { usePrayersTrackingStore } from '@/store/prayersTrackingStore';
import { PrayerName } from '@/types/prayer.types';
import { resolveTrackingDate } from '@/utils/prayerTracking';
import * as Sentry from '@sentry/react-native';
import { useEffect, useRef } from 'react';
import notifee, { EventType } from 'react-native-notify-kit';

export function useNotificationsSync() {
  const deviceSettingsReady = useDeviceSettingsStore((state) => state.isReady);
  const notificationsReady = useNotificationsStore((state) => state.isReady);
  const notificationPermission = useDeviceSettingsStore((state) => state.notificationPermission);
  const prayerTimes = usePrayersStore((state) => state.prayerTimes);
  const yearlyHolidays = useHolidaysStore((state) => state.yearlyHolidays);
  const language = useLanguageStore((state) => state.language);

  // Ref to prevent race conditions
  const isSchedulingRef = useRef(false);

  // ------------------------------------------------------------
  // CREATE notifications CHANNELS once on app load (Android only)
  // ------------------------------------------------------------
  useEffect(() => {
    const initChannels = async () => {
      try {
        await createNotificationsChannels();
        // console.log('✅ Notification channels created or already exist');
      } catch (err) {
        console.error('Failed to create notification channels:', err);
        Sentry.captureException(err);
      }
    };
    initChannels();
  }, []);

  // ------------------------------------------------------------
  // AUTO-SCHEDULE notifications when prayer times are ready and notifications are enabled
  // This runs on initial load and whenever something changes
  // ------------------------------------------------------------
  useEffect(() => {
    if (!deviceSettingsReady || !notificationsReady || !prayerTimes || !notificationPermission) return;
    if (isSchedulingRef.current) return;

    isSchedulingRef.current = true;
    let cancelled = false;

    const syncNotifications = async () => {
      try {
        await useNotificationsStore.getState().syncNotifications();
      } catch (err) {
        if (!cancelled) {
          console.error('❌ Failed to schedule notifications:', err);
          Sentry.captureException(err);
        }
      } finally {
        isSchedulingRef.current = false;
      }
    };
    syncNotifications();

    return () => { cancelled = true; };
  }, [deviceSettingsReady, notificationsReady, prayerTimes, yearlyHolidays, notificationPermission, language]);

  // ------------------------------------------------------------
  // Notifee - FOREGROUND event handler
  // Listens for notification events while the app is in the foreground
  // ------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent(async ({ type, detail }) => {
      const { notification, pressAction } = detail;

      if (!notification) return;

      // Prayer tracking on 'done' action — done here to avoid circular dependency (store ↔ service)
      if (type === EventType.ACTION_PRESS && pressAction?.id === 'done') {
        try {
          const prayerName = notification.data?.prayerName as PrayerName | undefined;
          if (prayerName) {
            const prayerDate = notification.data?.prayerDate as string | undefined;
            const dateToUse = resolveTrackingDate(prayerDate);
            await usePrayersTrackingStore.getState().markPrayed(prayerName, dateToUse);
          }
        } catch (err) {
          console.error('❌ [Foreground] Failed to mark prayer as prayed:', err);
          Sentry.captureException(err);
        }
      }

      // Handled in notificationsService for both foreground and background
      try {
        await handleNotificationEvent(type, notification, pressAction, 'foreground', useNotificationsStore.getState().notifSettings);
      } catch (err) {
        console.error('❌ [Foreground] Failed to handle notification event:', err);
        Sentry.captureException(err);
      }
    });

    return () => unsubscribe();
  }, []);
}