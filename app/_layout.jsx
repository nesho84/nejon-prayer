import { Stack } from "expo-router";
import Toast from "react-native-toast-message";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { PrayersProvider } from "@/contexts/PrayersContext";
import AppStatusBar from "@/components/AppStatusBar";
import notifee, {
  AndroidColor,
  AndroidImportance,
  AndroidNotificationSetting,
  AndroidVisibility,
  EventType,
  TriggerType
} from '@notifee/react-native';

// ------------------------------------------------------------
// Background event handler - Notifee Notifications
// ------------------------------------------------------------
notifee.onBackgroundEvent(async ({ type, detail }) => {
  // console.log('🌙 Background notification event fired');
  const { notification, pressAction } = detail;

  // Ignore if no notification
  if (!notification) return;

  // Check Alarm & Reminders permission
  const settings = await notifee.getNotificationSettings();
  const hasAlarm = settings.android.alarm === AndroidNotificationSetting.ENABLED;

  switch (type) {
    case EventType.ACTION_PRESS:
      switch (pressAction?.id) {
        case 'mark-prayed':
          console.log(`✅ Background: Marked ${notification?.data?.prayer} as 'prayed'`);
          break;
        case 'snooze-prayer':
          console.log(`⏰ Background: Snoozed ${notification?.data?.prayer}`);

          try {
            // Create reminder-specific channel
            await notifee.createChannel({
              id: 'prayer-reminders',
              name: 'Prayer Reminders',
              description: "Reminder for daily prayer times",
              importance: AndroidImportance.HIGH,
              visibility: AndroidVisibility.PUBLIC,
              sound: 'default',
              vibration: true,
              bypassDnd: true,
            });

            // Schedule timestamp reminder
            await notifee.createTriggerNotification(
              {
                id: `prayer-snooze-${notification?.data?.prayer || 'unknown'}`,
                title: "Prayer Reminder",
                body: `Don't forget your ${notification?.data?.prayer || 'prayer'} time`,
                data: { type: "prayer-reminder" },
                android: {
                  channelId: 'prayer-notifications',
                  smallIcon: 'ic_stat_prayer',
                  largeIcon: require('../assets/images/alarm-clock.png'),
                  color: AndroidColor.RED,
                  pressAction: { id: 'default', launchActivity: 'default' },
                }
              },
              {
                type: TriggerType.TIMESTAMP,
                timestamp: Date.now() + (10 * 60 * 1000), // 10 minutes
                alarmManager: hasAlarm,
              }
            );
            console.log("🔔 Background: Prayer reminder scheduled for later...");
          } catch (err) {
            console.error("Failed to schedule background reminder:", err);
          }
          break;
      }
      break;
    case EventType.PRESS:
      console.log('👆 Background: Notification pressed - app will open');
      break;
  }
});

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <PrayersProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "transparent" },
              animation: "fade",
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
          </Stack>
          <Toast />
          <AppStatusBar />
        </PrayersProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
