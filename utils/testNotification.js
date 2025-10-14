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
                    language: appSettings?.language,
                    soundVolume: String(appSettings?.notificationsConfig?.soundVolume ?? 1),
                    vibrationPattern: appSettings?.notificationsConfig?.vibrationPattern ?? "long",
                    snoozeTimeout: String(appSettings?.notificationsConfig?.snoozeTimeout ?? 1),
                    reminderTitle: "» Sabahu «",
                    reminderBody: "Kujtesë Lutjeje",
                },
                android: {
                    channelId: "prayer-notifications-channel", // (is created in NotificationsContext.js)
                    showTimestamp: true,
                    smallIcon: "ic_stat_prayer",
                    largeIcon: require("../assets/images/moon-islam.png"),
                    sound: undefined,
                    color: AndroidColor.OLIVE,
                    pressAction: { id: "default", launchActivity: "default" },
                    actions: [
                        { title: "Prayed", pressAction: { id: "mark-prayed" } },
                        { title: "Remind Later", pressAction: { id: "snooze-prayer" } },
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

        console.log(`🔔 Test notification scheduled in ${remainingSeconds}s | language="${appSettings?.language}"`);
    } catch (err) {
        console.error("❌ Failed to schedule test notification:", err);
    }
}
