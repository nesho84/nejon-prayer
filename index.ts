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

    // This ensures we have notifications with the latest prayer times — done here to avoid circular dependency (store ↔ service)
    // onBackgroundEvent only fires for our own notifee notifications, so any delivery is a valid sync trigger.
    if (type === EventType.DELIVERED) {
        try {
            // Refresh in-memory store from MMKV first (it can go stale in the background)
            await useNotificationsStore.persist.rehydrate();
            // Sync notifications in the background to ensure we have the latest prayer times
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
                // Refresh in-memory store from MMKV first (it can go stale in the background)
                await usePrayersTrackingStore.persist.rehydrate();
                // Mark the prayer as prayed in the background
                await usePrayersTrackingStore.getState().markPrayed(prayerName, dateToUse);
            }
        } catch (error) {
            console.error('❌ [index.ts:Background] Failed to mark prayer as prayed:', error);
            Sentry.captureException(error);
        }
    }

    // Handled in notificationsService for both foreground and background
    try {
        await handleNotificationEvent(type, notification, pressAction, 'background', useNotificationsStore.getState().notifSettings);
    } catch (err) {
        console.error('❌ [index.ts:Background] Failed to handle notification event:', err);
        Sentry.captureException(err);
    }
});