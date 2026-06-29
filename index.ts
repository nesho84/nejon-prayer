import 'expo-router/entry'; // This auto-registers the root app

import { PrayerName } from '@/types/prayer.types';
import { resolveTrackingDate } from '@/utils/tracking';
import * as Sentry from '@sentry/react-native';
import notifee, { EventType } from 'react-native-notify-kit';
import TrackPlayer, { Event } from 'react-native-track-player';
import { handleNotificationEvent } from './src/services/notificationsService';
import { useNotificationsStore } from './src/store/notificationsStore';
import { usePrayersTrackingStore } from './src/store/prayersTrackingStore';

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
// 'react-native-track-player' playback service
// Listens for remote events (play, pause, stop), while the app is in the background or killed
// ------------------------------------------------------------
TrackPlayer.registerPlaybackService(() => {
    return async () => {
        TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
        TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
        TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());
    }
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
        }

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