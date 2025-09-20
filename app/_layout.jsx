import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import notifee, { EventType, TriggerType } from '@notifee/react-native';
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { PrayersProvider } from "@/contexts/PrayersContext";

// ------------------------------------------------------------
// Notifee Notifications - Background event handler
// ------------------------------------------------------------
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;

  // console.log('🌙 Background notification event fired');

  switch (type) {
    case EventType.ACTION_PRESS:
      switch (pressAction?.id) {
        case 'mark-prayed':
          console.log(`✅ Background: Marked ${notification?.data?.prayer} as 'prayed'`);
          break;
        case 'snooze-prayer':
          console.log(`⏰ Background: Snoozed ${notification?.data?.prayer}`);
          // Schedule ? minute reminder
          try {
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
                  color: '#FF9500',
                }
              },
              {
                type: TriggerType.TIMESTAMP,
                timestamp: Date.now() + (10 * 60 * 1000), // 10 minutes
                alarmManager: { allowWhileIdle: true }, // When in low-power idle modes
              }
            );
            console.log("🔔 Background: Prayer reminder scheduled for later...");
          } catch (err) {
            console.error("Failed to schedule background reminder:", err);
          }
          break;
        case 'test-action':
          console.log("🧪 Background: Test action pressed");
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
              contentStyle: {
                backgroundColor: "transparent"
              },
              animation: "fade",
            }}
          />
          <StatusBar style="auto" />
        </PrayersProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
