import { PrayerName } from '@/types/prayer.types';
import { toDateKey } from '@/utils/datetime';
import { resolveTrackingDate } from '@/utils/tracking';
import * as Sentry from '@sentry/react-native';
import notifee, { EventType } from 'react-native-notify-kit';
import { handleNotificationEvent, sweepStaleDisplayedNotifications } from './src/services/notificationsService';
import { useNotificationsStore } from './src/store/notificationsStore';
import { usePrayersStore } from './src/store/prayersStore';
import { usePrayersTrackingStore } from './src/store/prayersTrackingStore';

// Must stay last — registers the app entry after all side effects (Expo docs)
import 'expo-router/entry';

// ------------------------------------------------------------
// Sentry initialization
// Is called here in index.ts (the entry point) so that it runs in headless background tasks as well as the main app.
// ------------------------------------------------------------
Sentry.init({
    dsn: 'https://df36491525a3844176da451e9b5710de@o4511285567488000.ingest.de.sentry.io/4511285569126480',
    enabled: !__DEV__,
    enableLogs: false,
    tracesSampleRate: 0,
    debug: false,
});

// ------------------------------------------------------------
// 'Notifee' - BACKGROUND event handler
// Listens for notification events, while the app is in the background or killed
// ------------------------------------------------------------
notifee.onBackgroundEvent(async ({ type, detail }) => {
    const { notification, pressAction } = detail;

    if (!notification) return;

    try {
        // This ensures we have notifications with the latest prayer times — done here to avoid circular dependency (store ↔ service)
        // onBackgroundEvent only fires for our own notifee notifications, so any delivery is a valid sync trigger.
        if (type === EventType.DELIVERED) {
            try {
                await useNotificationsStore.getState().syncNotificationsInBackground();
            } catch (err) {
                console.error('❌ [index.ts:Background] Failed to sync notifications in background:', err);
                Sentry.captureException(err);
            }

            // On the daily Fajr delivery, clear yesterday's leftover notifications from the tray
            // @Caution: best-effort — skipped if Fajr is disabled or its delivery is missed
            if (notification.data?.prayerName === 'Fajr') {
                await sweepStaleDisplayedNotifications();
            }
        }

        // Prayer tracking on 'done' action — done here to avoid circular dependency (store ↔ service)
        if (type === EventType.ACTION_PRESS && pressAction?.id === 'done') {
            try {
                const prayerName = notification.data?.prayerName as PrayerName | undefined;
                if (prayerName) {
                    const today = toDateKey();
                    const fajrTime = usePrayersStore.getState().yearlyPrayerTimes?.[today]?.Fajr;
                    const dateToUse = resolveTrackingDate(prayerName, fajrTime);
                    await usePrayersTrackingStore.getState().markPrayed(prayerName, dateToUse, 'notif-bg');
                }
            } catch (err) {
                console.error('❌ [index.ts:Background] Failed to mark prayer as prayed:', err);
                Sentry.captureException(err);
            }
        }

        // Handled in notificationsService for both foreground and background
        try {
            await handleNotificationEvent(type, notification, pressAction, 'background', useNotificationsStore.getState().notifSettings);
        } catch (err) {
            console.error('❌ [index.ts:Background] Failed to handle notification event:', err);
            Sentry.captureException(err);
        }

    } finally {
        // Headless tasks are torn down fast — flush so queued Sentry events upload before suspension.
        await Sentry.flush();
    }
});