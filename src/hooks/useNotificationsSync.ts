import { useEffect, useRef } from 'react';
import notifee from '@notifee/react-native';
import { useNotificationsStore } from '@/store/notificationsStore';
import { handleNotificationEvent } from '@/services/notificationsService';
import { usePrayersStore } from '@/store/prayersStore';
import { useDeviceSettingsStore } from '@/store/deviceSettingsStore';

export function useNotificationsSync() {
  // Access and initialize necessary state from stores
  const deviceSettingsReady = useDeviceSettingsStore((state) => state.isReady);
  const notificationPermission = useDeviceSettingsStore((state) => state.notificationPermission);
  const prayerTimes = usePrayersStore((state) => state.prayerTimes);
  const notificationsReady = useNotificationsStore((state) => state.isReady);

  // Ref to prevent race conditions
  const isSchedulingRef = useRef(false);

  // ------------------------------------------------------------
  // Auto-schedule notifications when prayer times are ready and notifications are enabled
  // This runs on initial load and whenever prayer times change
  // ------------------------------------------------------------
  useEffect(() => {
    if (!deviceSettingsReady || !notificationsReady || !prayerTimes || !notificationPermission) {
      return;
    }

    if (isSchedulingRef.current) return;

    let mounted = true;
    isSchedulingRef.current = true;

    (async () => {
      try {
        await useNotificationsStore.getState().scheduleNotifications();
      } catch (err) {
        console.error('Failed to schedule notifications:', err);
      } finally {
        if (mounted) isSchedulingRef.current = false;
      }
    })();

    return () => {
      mounted = false;
      isSchedulingRef.current = false;
    };
  }, [deviceSettingsReady, notificationsReady, prayerTimes, notificationPermission]);

  // ------------------------------------------------------------
  // Notify FOREGROUND EVENT HANDLER
  // Listens for notification events while the app is in the foreground
  // (e.g., user taps on a notification, dismisses it, etc.)
  // ------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent(async ({ type, detail }) => {
      const { notification, pressAction } = detail;
      if (!notification) return;

      try {
        await handleNotificationEvent(type, notification, pressAction, 'foreground');
      } catch (err) {
        console.error('Failed to handle notification event:', err);
      }
    });

    return () => unsubscribe();
  }, []);
}