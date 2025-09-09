import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Alert, Linking, Platform } from "react-native";

// Set notification handler to show notifications when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

export default function usePrayerNotifications() {
    // Request notification permissions
    const requestPermission = async () => {
        try {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== "granted") {
                Alert.alert(
                    "Notification Permission",
                    "You have denied notification permission. Please enable it in your device settings to receive prayer notifications.",
                    [
                        {
                            text: "OK",
                            onPress: async () => Linking.openSettings(),
                        },
                    ],
                    { cancelable: false }
                );
            }
        } catch (err) {
            console.error("Error requesting notification permission:", err);
        }
    };

    // Set up notification channel for Android
    const setNotificationChannel = async () => {
        if (Platform.OS === "android") {
            await Notifications.setNotificationChannelAsync("default", {
                name: "default",
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: "#ffffff",
            });
        }
    };

    // Schedule today's Prayer notifications
    const scheduleDailyPrayerNotifications = async (times) => {
        try {
            await requestPermission();
            await setNotificationChannel();

            // Cancel existing prayer notifications
            const all = await Notifications.getAllScheduledNotificationsAsync();
            for (const item of all) {
                if (item.content?.data?.type === "prayer") {
                    await Notifications.cancelScheduledNotificationAsync(item.identifier);
                }
            }

            const now = new Date();

            // Already filtered & ordered in api.js
            for (const [name, timeString] of Object.entries(times)) {
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

    // Debug utility: list/log all scheduled notifications
    const logScheduledNotifications = async () => {
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
    const sendTestNotification = async () => {
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

    // Set up listeners for received notifications & responses
    useEffect(() => {
        // app open in Foreground
        const receivedListener = Notifications.addNotificationReceivedListener(async (notification) => {
            // const prayer = notification.request.content.data.prayer;
            // console.log('Received notification:', notification);
            // await Notifications.setBadgeCountAsync(1);
        });
        // app closed in backgrdound
        const responseReceivedListener = Notifications.addNotificationResponseReceivedListener(async (response) => {
            // const prayer = notification.request.content.data.prayer;
            // console.log('User responded to received notification:', response);
        });

        return () => {
            // Cleanup listeners when unmounting
            receivedListener.remove();
            responseReceivedListener.remove();
        };
    }, []);

    return {
        scheduleDailyPrayerNotifications,
        sendTestNotification,
        logScheduledNotifications,
    };
}
