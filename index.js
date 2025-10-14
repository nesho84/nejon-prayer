import 'expo-router/entry'; // This auto-registers the root app

import notifee from '@notifee/react-native';
import { handleNotificationEvent } from '@/utils/notificationManager';

// ------------------------------------------------------------
// Background handler for Notifee
// This will fire when a notification action is pressed
// and the app is killed or in background
// ------------------------------------------------------------
notifee.onBackgroundEvent(async ({ type, detail }) => {
    const { notification, pressAction } = detail;

    // Ignore if no notification
    if (!notification) return;

    await handleNotificationEvent(type, notification, pressAction, 'background');
});
