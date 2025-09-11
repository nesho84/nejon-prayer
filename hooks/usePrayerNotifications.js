import { useLanguage } from "@/context/LanguageContext";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect } from "react";
import { Alert, Linking, Platform } from "react-native";

// Set notification handler to show notifications when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export default function usePrayerNotifications() {
    const { lang } = useLanguage();

    // Request notification permission
    const requestPermission = async (lang) => {
        try {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== "granted") {
                Alert.alert(
                    lang("labels.notifications"),
                    lang("labels.warning3"),
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

    // Android notification channel
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

    // Cancel all existing prayer notifications
    const cancelPrayerNotifications = async () => {
        try {
            const all = await Notifications.getAllScheduledNotificationsAsync();
            for (const item of all) {
                if (item.content?.data?.type === "prayer") {
                    await Notifications.cancelScheduledNotificationAsync(item.identifier);
                }
            }
            console.log("✅ All existing prayer notifications cancelled");
        } catch (err) {
            console.error("❌ Failed to cancel prayer notifications", err);
        }
    }

    // Schedule today's Prayer notifications
    const schedulePrayerNotifications = useCallback(
        async (times) => {
            try {
                await requestPermission(lang);
                // Clear existing prayer notifications first
                await cancelPrayerNotifications();
                await setNotificationChannel();

                // Schedule notifications for each prayer time
                const now = new Date();
                const PRAYER_ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
                for (const name of PRAYER_ORDER) {
                    const timeString = times[name]; // e.g. "05:32"
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
                            title: `${lang(`prayers.${name}`)} ${timeString}`,
                            body: `${lang("labels.alertBody")}`,
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
        },
        [lang]
    );

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
    const sendTestNotification = useCallback(
        async () => {
            try {
                await setNotificationChannel();

                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: `(Test) Fajr 5:32`,
                        body: `${lang("labels.alertBody")}`,
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
        },
        [lang]
    );

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
        schedulePrayerNotifications,
        cancelPrayerNotifications,
        sendTestNotification,
        logScheduledNotifications,
    };
}
