import 'expo-router/entry'; // This auto-registers the root app

import notifee, {
    AndroidColor,
    AndroidImportance,
    AndroidNotificationSetting,
    AndroidVisibility,
    EventType,
    TriggerType
} from '@notifee/react-native';

// ------------------------------------------------------------
// Background handler for Notifee
// This will fire when a notification action is pressed
// and the app is killed or in background
// ------------------------------------------------------------
notifee.onBackgroundEvent(async ({ type, detail }) => {
    const { notification, pressAction } = detail;

    // Ignore if no notification
    if (!notification) return;

    console.log(`🌙 [Background] Notification event fired: (prayer: "${notification?.data?.prayer || 'N/A'}")`);

    // Check Alarm & Reminders permission
    const settings = await notifee.getNotificationSettings();
    const hasAlarm = settings.android.alarm === AndroidNotificationSetting.ENABLED;

    // Handle event types
    switch (type) {
        case EventType.ACTION_PRESS:
            switch (pressAction?.id) {
                case 'mark-prayed':
                    console.log(`✅ [Background] Action: Marked "${notification?.data?.prayer}" as prayed`);
                    break;
                case 'snooze-prayer':
                    console.log(`⏰ [Background] Action: Snoozed "${notification?.data?.prayer}"`);

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
                                    largeIcon: require('./assets/images/alarm-clock.png'),
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
                    } catch (err) {
                        console.error("❌ [Background] Failed to schedule snooze reminder:", err);
                    }
                    break;
            }
            break;
        case EventType.PRESS:
            console.log(`👆 [Background] Notification pressed for ${notification?.data?.prayer || 'N/A'} - app will open...")`);
            break;
    }
});

// (Optional) If you also use Firebase messaging
// import messaging from '@react-native-firebase/messaging';
// messaging().setBackgroundMessageHandler(async remoteMessage => {
//   console.log('Received background message:', remoteMessage);
// });