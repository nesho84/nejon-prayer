import notifee, {
    AndroidImportance,
    AndroidVisibility,
    AndroidColor,
    AndroidStyle,
    AndroidNotificationSetting,
    TriggerType,
} from "@notifee/react-native";

// ------------------------------------------------------------
// Debug utility: schedule a test notification
// ------------------------------------------------------------
export async function testNotification({ language = "en", seconds = 10 } = {}) {
    try {
        // Default to 10 seconds later if no timestamp passed
        const fireTime = Date.now() + seconds * 1000;

        // Check alarm permission
        const settings = await notifee.getNotificationSettings();
        const hasAlarm = settings.android.alarm === AndroidNotificationSetting.ENABLED;

        // Create channel for test notifications
        await notifee.createChannel({
            id: "test-notifications",
            name: "Test Notifications",
            description: "Notifications for testing only",
            importance: AndroidImportance.HIGH,
            visibility: AndroidVisibility.PUBLIC,
            sound: "default",
            vibration: true,
            vibrationPattern: [300, 500, 300, 500],
            lights: true,
            lightColor: AndroidColor.WHITE,
            badge: true,
            bypassDnd: true,
        });

        // Schedule the notification
        await notifee.createTriggerNotification(
            {
                id: "prayer-test",
                title: "» Fajr « 5:30 (test)",
                body: "It's prayer time",
                data: {
                    type: "prayer",
                    prayer: "Fajr",
                    language,
                    scheduledAt: new Date().toLocaleString("en-GB"),
                },
                android: {
                    channelId: "test-notifications",
                    smallIcon: "ic_stat_prayer",
                    largeIcon: require("../assets/images/prayer-mat-mixed.png"),
                    color: AndroidColor.RED,
                    pressAction: { id: "default", launchActivity: "default" },
                    actions: [
                        { title: "Prayed", pressAction: { id: "mark-prayed" } },
                        { title: "Remind Later", pressAction: { id: "snooze-prayer" } },
                    ],
                    style: {
                        type: AndroidStyle.INBOX,
                        lines: ["It's prayer time (test)"],
                    },
                    autoCancel: true,
                    ongoing: false,
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

        console.log(
            `🔔 Test notification scheduled in ${remainingSeconds}s | language="${language}"`
        );
    } catch (err) {
        console.error("❌ Failed to schedule test notification:", err);
    }
}
