import notifee, {
    AndroidColor,
    AndroidStyle,
    AndroidNotificationSetting,
    TriggerType,
} from "@notifee/react-native";

// ------------------------------------------------------------
// Debug utility: schedule a test notification
// ------------------------------------------------------------
export async function testNotification({ appSettings = null, seconds = 10 } = {}) {
    try {
        // Default to 10 seconds later if no timestamp passed
        const fireTime = Date.now() + seconds * 1000;

        // Extract config for cleaner dependency tracking
        const notificationsConfig = appSettings?.notificationsConfig;

        // Check alarm permission
        const settings = await notifee.getNotificationSettings();
        const hasAlarm = settings.android.alarm === AndroidNotificationSetting.ENABLED;

        // Schedule the notification
        await notifee.createTriggerNotification(
            {
                id: "prayer-test",
                title: "» Sabahu «",
                body: "Koha për namaz (06:15)",
                data: {
                    type: "prayer-notification",
                    prayer: "Sabahu",
                    reminderTitle: "» Sabahu «",
                    reminderBody: "Kujtesë Lutjeje",
                    language: appSettings?.language,
                    soundVolume: String(notificationsConfig?.soundVolume ?? 1.0),
                    vibration: notificationsConfig?.vibration ?? "medium",
                    snoozeTimeout: String(notificationsConfig?.snoozeTimeout ?? 5),
                },
                android: {
                    // (is created in notificationService.js)
                    channelId: `prayer-notifications-channel-${notificationsConfig?.vibration ?? 'medium'}`,
                    showTimestamp: true,
                    smallIcon: "ic_stat_prayer",
                    largeIcon: require("../assets/images/moon-islam.png"),
                    sound: undefined,
                    color: AndroidColor.OLIVE,
                    pressAction: { id: "default", launchActivity: "default" },
                    actions: [
                        { title: "Dismiss", pressAction: { id: "stop" } },
                        { title: "Remind me later", pressAction: { id: "snooze" } },
                    ],
                    style: {
                        type: AndroidStyle.INBOX,
                        lines: ["Koha për namaz. (06:15)"],
                    },
                    autoCancel: false,
                    ongoing: true,
                },
                ios: {
                    categoryId: "prayer-category",
                    critical: false,
                    interruptionLevel: "active",
                },
            },
            {
                type: TriggerType.TIMESTAMP,
                timestamp: fireTime,
                alarmManager: hasAlarm,
            }
        );

        const remainingSeconds = Math.max(0, Math.floor((fireTime - Date.now()) / 1000) + 1);

        console.log(`🔔 Test notification scheduled to trigger in ${remainingSeconds}seconds...
            channelId: ${`prayer-notifications-channel-${notificationsConfig?.vibration}`}
            language: ${appSettings?.language},
            alarm: ${hasAlarm},
            soundVolume: ${notificationsConfig?.soundVolume},
            vibration: ${notificationsConfig?.vibration},
            snoozeTimeout: ${notificationsConfig?.snoozeTimeout}
            `);

    } catch (err) {
        console.error("❌ Failed to schedule test notification:", err);
    }
}

export async function debugChannelsAndScheduled() {
    try {
        const channels = await notifee.getChannels();
        const channelsObj = channels.map(c => ({
            id: c.id,
            name: c.name,
            vibration: c.vibration,
            vibrationPattern: c.vibrationPattern,
            importance: c.importance
        }));
        console.log('📡 All channels:', channelsObj);

        const scheduled = await notifee.getTriggerNotifications();
        const scheduledObj = scheduled.map(n => ({
            id: n.notification.id,
            channelId: n.notification.android?.channelId,
            data: n.notification.data,
            timestamp: n.trigger?.timestamp
        }));
        console.log('⏰ Scheduled trigger notifications:', JSON.stringify(scheduledObj, null, 2));

        const settings = await notifee.getNotificationSettings();
        console.log('🔧 Notification settings:', settings);
    } catch (err) {
        console.error('❌ debugChannelsAndScheduled failed:', err);
    }
}

