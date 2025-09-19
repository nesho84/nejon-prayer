import { useEffect, useRef } from "react";
import { Alert, Linking, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { useSettingsContext } from "@/contexts/SettingsContext";
import { usePrayersContext } from "@/contexts/PrayersContext";
import useTranslation from "@/hooks/useTranslation";

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
    const { tr, currentLang } = useTranslation();
    const isInitialized = useRef(false);
    const lastScheduledTimes = useRef(null);

    // Initialize permissions and channel once
    const initialize = async () => {
        if (isInitialized.current) return true;

        try {
            // Request permission
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== "granted") {
                Alert.alert(
                    tr("labels.notifications"),
                    tr("labels.warning3"),
                    [{ text: "OK", onPress: () => Linking.openSettings() }],
                    { cancelable: false }
                );
                return false;
            }

            // Set Android channel
            if (Platform.OS === "android") {
                await Notifications.setNotificationChannelAsync("default", {
                    name: "default",
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: "#ffffff",
                });
            }

            isInitialized.current = true;
            return true;
        } catch (err) {
            console.error("❌ Notification initialization failed:", err);
            return false;
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
            console.log("⚠️  All existing prayer notifications cancelled");
            lastScheduledTimes.current = null;
        } catch (err) {
            console.error("❌ Failed to cancel prayer notifications", err);
        }
    };

    // Schedule prayer notifications
    const schedulePrayerNotifications = async (times, language = null) => {
        // Use passed language or current
        const useLanguage = language || currentLang;

        // Prevent duplicate scheduling
        const timesKey = JSON.stringify({ times, language: useLanguage });
        if (lastScheduledTimes.current === timesKey) {
            console.log("⚠️ Same prayer times and language already scheduled, skipping");
            return;
        }

        try {
            // Initialize if needed
            const initialized = await initialize();
            if (!initialized) {
                console.log("❌ Notification initialization failed");
                return;
            }

            // Cancel existing notifications first
            await cancelPrayerNotifications();

            const now = new Date();
            const PRAYER_ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
            let scheduledCount = 0;

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

                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: `${tr(`prayers.${name}`)} ${timeString}`,
                        body: tr("labels.alertBody"),
                        sound: true,
                        android: { channelId: "default" },
                        data: { type: "prayer", prayer: name },
                    },
                    trigger: { type: "date", date: fireDate },
                });

                scheduledCount++;

                // Debugg logging: Format date as DD/MM/YYYY, HH:mm:ss
                const formattedDate = fireDate.toLocaleDateString('en-GB') + ', ' +
                    fireDate.toLocaleTimeString('en-GB', { hour12: false });
                console.log(`⏰ Scheduled ${name} at ${formattedDate}`);
            }

            lastScheduledTimes.current = timesKey;

            console.log(`🔔 ${scheduledCount} prayer notifications scheduled with language "${useLanguage}"`);
        } catch (err) {
            console.error("❌ Failed to schedule prayer notifications:", err);
        }
    };

    // Debug utility: send a test notification
    const sendTestNotification = async () => {
        try {
            await initialize();
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: `(Test) Fajr 5:32`,
                    body: `${tr("labels.alertBody")}`,
                    sound: true,
                    android: { channelId: "default" },
                    data: { type: "test" },
                },
                trigger: { type: "date", date: new Date(Date.now() + 5000) }, // 5 sec.
            });
            console.log("📱 Test notification scheduled");
        } catch (err) {
            Alert.alert("Error", "Failed to send test notification");
            console.error(err);
        }
    };

    // Debug utility: list/log all scheduled notifications
    const logScheduledNotifications = async () => {
        const all = await Notifications.getAllScheduledNotificationsAsync();
        const mapped = all.map(n => ({
            id: n.identifier,
            title: n.content.title,
            body: n.content.body,
            data: n.content.data,
            trigger: n.trigger
        }));
        console.log("📌 Scheduled notifications:", JSON.stringify(mapped, null, 2));
        return mapped;
    };

    // Set up listeners for received notifications & responses
    useEffect(() => {
        // App open in Foreground
        const receivedListener = Notifications.addNotificationReceivedListener(async (notification) => {
            // Handle foreground notifications
            // const prayer = notification.request.content.data.prayer;
            // console.log('Received notification:', notification);
            // await Notifications.setBadgeCountAsync(1);
        });

        // App closed in backgrdound
        const responseReceivedListener = Notifications.addNotificationResponseReceivedListener(async (response) => {
            // Handle user interaction with notification
            // const prayer = notification.request.content.data.prayer;
            // console.log('User responded to received notification:', response);
            // const badgeCount = await Notifications.getBadgeCountAsync();
        });

        return () => {
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