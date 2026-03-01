import 'expo-router/entry'; // This auto-registers the root app

import notifee from '@notifee/react-native';
import TrackPlayer from 'react-native-track-player';
import { handleNotificationEvent } from './src/services/notificationsService';
import { TrackPlayerService } from './src/services/trackPlayerService';

// ------------------------------------------------------------
// Initialize react-native-track-player playback service
// ------------------------------------------------------------
TrackPlayer.registerPlaybackService(() => TrackPlayerService);

// ------------------------------------------------------------
// Notifee - BACKGROUND event handler
// Listens for notification events while the app is in the background or killed
// ------------------------------------------------------------
notifee.onBackgroundEvent(async ({ type, detail }) => {
    const { notification, pressAction } = detail;
    if (!notification) return;
    await handleNotificationEvent(type, notification, pressAction, 'background');
});