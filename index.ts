import 'expo-router/entry'; // This auto-registers the root app

import notifee, { EventType } from 'react-native-notify-kit';
import TrackPlayer, { Event } from 'react-native-track-player';
import { handleNotificationEvent } from './src/services/notificationsService';
import { useNotificationsStore } from './src/store/notificationsStore';

// ------------------------------------------------------------
// 'react-native-track-player' playback service
// Listens listens for remote events (play, pause, stop), while the app is in the background or killed
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

    // This ensures we have notifications with the latest prayer times
    if (type === EventType.DELIVERED && notification.data?.type === 'prayer') {
        useNotificationsStore.getState().syncNotificationsInBackground();
    }

    // Handled in notificationsService for both foreground and background
    await handleNotificationEvent(type, notification, pressAction, 'background');
});