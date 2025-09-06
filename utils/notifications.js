// utils/notifications.js
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// ✅ Required foreground handler (otherwise notifications may not show while app is open)
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export async function setupNotificationChannel() {
    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
            sound: true,
        });
    }
}

export async function clearPrayerNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function schedulePrayerNotifications(timings) {
    // timings should be an object like { Fajr: "05:10", Dhuhr: "13:15", ... }

    await clearPrayerNotifications();

    for (const [name, time] of Object.entries(timings)) {
        const [hour, minute] = time.split(":").map(Number);

        await Notifications.scheduleNotificationAsync({
            content: {
                title: `${name} Prayer`,
                body: `It's time for ${name} prayer.`,
                sound: true,
            },
            trigger: { hour, minute, repeats: true }, // daily at that time
        });
    }
}

// For testing purposes
export async function sendTestNotification() {
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Test Prayer Notification",
                body: "This is a test notification. Everything works!",
                sound: true,
                android: { channelId: 'default' },
            },
            trigger: { type: 'date', date: new Date(Date.now() + 5000) }, // 5 seconds from now
        });

        Alert.alert("Success", "Successfully scheduled test notification in 5 seconds");
    } catch (err) {
        Alert.alert("Error", "Failed to schedule prayer notifications");
        console.error(err);
    }
}