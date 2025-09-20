import { PrayersProvider } from "@/contexts/PrayersContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import notifee, { EventType, TriggerType } from '@notifee/react-native';
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

// ------------------------------------------------------------
// Notifee Notifications - Background event handler
// ------------------------------------------------------------
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;

  console.log('🌙 Background notification event:', type, pressAction?.id);

  switch (type) {
    case EventType.ACTION_PRESS:
      switch (pressAction?.id) {
        case 'mark-prayed':
          console.log(`✅ Background: Marked ${notification?.data?.prayer} as prayed`);
          // Handle prayer completion without opening app
          break;

        case 'snooze-prayer':
          console.log(`⏰ Background: Snoozed ${notification?.data?.prayer}`);

          // Schedule 10-minute reminder
          try {
            await notifee.createTriggerNotification(
              {
                id: `prayer-snooze-${notification?.data?.prayer}`,
                title: `🔔 Prayer Reminder: ${notification?.data?.prayer}`,
                body: "You asked to be reminded about prayer time",
                data: {
                  type: "prayer-reminder",
                  // prayer: notification?.data?.prayer,
                  // originalTime: notification?.data?.time
                },
                android: {
                  channelId: 'prayer-notifications',
                  smallIcon: 'ic_stat_prayer',
                  largeIcon: require('./assets/images/alarm-clock.png'),
                  color: '#FF9500',
                }
              },
              {
                type: TriggerType.TIMESTAMP,
                timestamp: Date.now() + (10 * 60 * 1000), // 10 minutes
                alarmManager: true,
              }
            );
            console.log("🔔 Background: Prayer reminder scheduled");
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
