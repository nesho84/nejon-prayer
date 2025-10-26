import 'expo-router/entry'; // This auto-registers the root app

// Background handler for Notifee
// This will fire when:
// The device is locked.
// The application is running & is in not in view (minimized).
// The application is killed/quit.
// Notification action is pressed
import './src/services/notificationService';

