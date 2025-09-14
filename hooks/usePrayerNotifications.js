import { useLanguage } from "@/context/LanguageContext";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Alert, Linking, Platform } from "react-native";

// Set notification handler to show notifications when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export default function usePrayerNotifications() {
    const { lang, currentLang } = useLanguage();

    // Request notification permission
    const requestPermission = async () => {
        try {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== "granted") {
                Alert.alert(
                    lang.tr("labels.notifications"),
                    lang.tr("labels.warning3"),
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
                importance: Notifications.AndroidImportance.HIGH,
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
            // console.log("🟧 All existing prayer notifications cancelled");
        } catch (err) {
            console.error("❌ Failed to cancel prayer notifications", err);
        }
    }

    // Schedule today's Prayer notifications
    const schedulePrayerNotifications = async (times) => {
        try {
            await requestPermission();
            await cancelPrayerNotifications();
            await setNotificationChannel();

            const now = new Date();
            const PRAYER_ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

            for (const name of PRAYER_ORDER) {
                const timeStringRaw = times[name];
                if (!timeStringRaw) {
                    console.log(`⚠️ No time for ${name}`);
                    continue;
                }

                // Normalize: trim + replace NBSP
                const timeString = String(timeStringRaw).replace(/\u00A0/g, " ").trim();
                // Parse "HH:mm" strictly
                const m = timeString.match(/^(\d{1,2}):(\d{2})$/);
                if (!m) {
                    console.warn(`⚠️ Invalid time format for ${name}:`, timeStringRaw);
                    continue;
                }

                const hour = Number(m[1]);
                const minute = Number(m[2]);
                const fireDate = new Date();
                fireDate.setHours(hour, minute, 0, 0);

                // If time already passed today → schedule tomorrow
                if (fireDate <= now) {
                    fireDate.setDate(fireDate.getDate() + 1);
                }

                console.log(`⏰ Scheduling ${name} at ${fireDate.toString()} (from "${timeString}")`);

                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: `${lang.tr(`prayers.${name}`)} ${timeString}`,
                        body: lang.tr("labels.alertBody"),
                        sound: true,
                        android: { channelId: "default" },
                        data: { type: "prayer", prayer: name },
                    },
                    trigger: { type: "date", date: fireDate },
                });
            }

            console.log(`✅ Prayer notifications scheduled with language [ ${currentLang} ]`);
        } catch (err) {
            console.error("❌ Failed to schedule prayer notifications", err);
        }
    };

    // Debug utility: send a test notification in 5 seconds
    const sendTestNotification = async () => {
        try {
            await requestPermission();
            await setNotificationChannel();

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: `(Test) Fajr 5:32`,
                    body: `${lang.tr("labels.alertBody")}`,
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
            // const badgeCount = await Notifications.getBadgeCountAsync();
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