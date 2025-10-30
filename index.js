import 'expo-router/entry'; // This auto-registers the root app

// ------------------------------------------------------------
// "@notifee/react-native" Background handler. This works when:
// The device is locked.
// The application is running & is in not in view (minimized).
// The application is killed/quit.
// Notification action is pressed
// ------------------------------------------------------------
import notifee from '@notifee/react-native';
import { handleNotificationEvent } from './src/services/notificationsService';

notifee.onBackgroundEvent(async ({ type, detail }) => {
    const { notification, pressAction } = detail;

    // Ignore if no notification
    if (!notification) return;

    // Call the Notification event handler
    await handleNotificationEvent(type, notification, pressAction, 'background');
});