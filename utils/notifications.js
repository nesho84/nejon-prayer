import * as Notifications from "expo-notifications";
import { Alert, Platform } from "react-native";

const PRAYER_ORDER = ["Imsak", "Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];

// Schedule today's notifications
export async function scheduleDailyPrayerNotifications(times) {
    try {
        // Cancel existing prayer notifications
        const all = await Notifications.getAllScheduledNotificationsAsync();
        for (const item of all) {
            if (item.content?.data?.type === "prayer") {
                await Notifications.cancelScheduledNotificationAsync(item.identifier);
            }
        }

        if (Platform.OS === "android") {
            await Notifications.setNotificationChannelAsync("default", {
                name: "default",
                importance: Notifications.AndroidImportance.MAX,
            });
        }

        const now = new Date();

        for (const name of PRAYER_ORDER) {
            const timeString = times[name];
            if (!timeString) continue;

            const [hourStr, minuteStr] = timeString.split(":");
            const hour = parseInt(hourStr, 10);
            const minute = parseInt(minuteStr, 10);

            const fireDate = new Date();
            fireDate.setHours(hour, minute, 0, 0);

            // Don’t schedule past prayers
            if (fireDate <= now) continue;

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: `Prayer time: ${name}`,
                    body: `${name} is at ${timeString}`,
                    data: { type: "prayer", prayer: name },
                    sound: true,
                    android: { channelId: "default" },
                },
                trigger: { type: "date", date: fireDate }, // no repeats → only today
            });
        }

        console.log("✅ Prayer notifications scheduled for today");
    } catch (err) {
        console.error("❌ Failed to schedule prayer notifications", err);
    }
}

// Debug utility: list all scheduled notifications
export async function listScheduledNotifications() {
    const all = await Notifications.getAllScheduledNotificationsAsync();

    // Map to avoid using deprecated dataString
    const mapped = all.map(n => ({
        id: n.identifier,
        title: n.content.title,
        body: n.content.body,
        data: n.content.data, // use this
        trigger: n.trigger
    }));

    console.log("📌 Scheduled notifications:", JSON.stringify(mapped, null, 2));
    return mapped;
}

// Debug utility: send a test notification in 5 seconds
export async function sendTestNotification() {
    try {
        if (Platform.OS === "android") {
            await Notifications.setNotificationChannelAsync("default", {
                name: "default",
                importance: Notifications.AndroidImportance.MAX,
            });
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Test Prayer Notification",
                body: "This is a test notification. Everything works!",
                sound: true,
                android: { channelId: "default" },
                data: { type: "test" },
            },
            trigger: { type: "date", date: new Date(Date.now() + 5000) }, // 5 seconds
        });
    } catch (err) {
        Alert.alert("Error", "Failed to send test notification");
        console.error(err);
    }
}
