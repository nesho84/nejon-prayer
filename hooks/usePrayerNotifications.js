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
    const { settings, settingsLoading } = useSettingsContext();
    const { prayersTimes, prayersLoading, hasPrayersTimes } = usePrayersContext();

    const isInitialized = useRef(false);
    const lastScheduledKey = useRef(null);

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
                    importance: Notifications.AndroidImportance.HIGH,
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
            console.log("⚠️ All existing prayer notifications cancelled");
            lastScheduledKey.current = null;
        } catch (err) {
            console.error("❌ Failed to cancel prayer notifications", err);
        }
    };

    // Schedule prayer notifications
    const schedulePrayerNotifications = async (times) => {
        try {
            console.log("🔔 Starting notification scheduling...");

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

            console.log(`✅ ${scheduledCount} prayer notifications scheduled with language "${currentLang}"`);
        } catch (err) {
            console.error("❌ Failed to schedule prayer notifications:", err);
        }
    };

    // AUTOMATIC SCHEDULING EFFECT - The core reactive logic
    useEffect(() => {
        const handleNotificationScheduling = async () => {
            // Don't do anything if contexts are still loading
            if (settingsLoading || prayersLoading) {
                return;
            }
            // Create a unique key that represents the current state
            const currentKey = JSON.stringify({
                notifications: settings?.notifications,
                location: settings?.location,
                language: currentLang,
                prayerTimes: prayersTimes,
            });
            // Skip if nothing relevant has changed
            if (lastScheduledKey.current === currentKey) {
                return;
            }
            // If notifications are disabled, cancel all and exit
            if (!settings?.notifications) {
                await cancelPrayerNotifications();
                lastScheduledKey.current = currentKey;
                return;
            }
            // If notifications are enabled but we don't have prayer times, just update the key
            if (!hasPrayersTimes) {
                console.log("📵 Notifications enabled but no prayer times available yet");
                lastScheduledKey.current = currentKey;
                return;
            }
            // If notifications are enabled and we have prayer times, schedule them
            if (settings.notifications && hasPrayersTimes) {
                await schedulePrayerNotifications(prayersTimes);
                lastScheduledKey.current = currentKey;
            }
        };
        handleNotificationScheduling();
    }, [
        settings?.notifications,   // When notifications are toggled
        settings?.location,        // When location changes
        currentLang,               // When language changes
        prayersTimes,              // When prayer times change
        hasPrayersTimes,           // When prayer times become available
        settingsLoading,           // When settings finish loading
        prayersLoading,            // When prayers finish loading
        tr                         // When translation function updates
    ]);

    // APP STARTUP/FOCUS EFFECT - Reschedule on app open/focus
    useEffect(() => {
        const handleAppStartup = async () => {
            // Only run when all contexts are ready
            if (settingsLoading || prayersLoading) {
                return;
            }
            // Only reschedule if notifications are enabled and we have prayer times
            if (!settings?.notifications || !hasPrayersTimes) {
                return;
            }

            console.log("🚀 App startup - checking if notifications need rescheduling...");

            try {
                // Check if we have any scheduled prayer notifications
                const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
                const prayerNotifications = allNotifications.filter(
                    n => n.content?.data?.type === "prayer"
                );
                // If no prayer notifications exist, schedule them
                if (prayerNotifications.length === 0) {
                    console.log("📋 No prayer notifications found, scheduling...");
                    await schedulePrayerNotifications(prayersTimes);
                    return;
                }
                // Check if any scheduled notifications are in the past (old/stale)
                const now = new Date();
                const oldNotifications = prayerNotifications.filter(notification => {
                    if (notification.trigger?.type === 'date') {
                        const fireDate = new Date(notification.trigger.date);
                        return fireDate < now;
                    }
                    return false;
                });

                // If we have stale notifications, reschedule everything
                if (oldNotifications.length > 0) {
                    console.log(`🕐 Found ${oldNotifications.length} stale notifications, rescheduling...`);
                    await schedulePrayerNotifications(prayersTimes);
                } else {
                    console.log("✅ All prayer notifications are current");
                }
            } catch (error) {
                console.error("❌ Error checking notification status:", error);
            }
        };

        // Only run when contexts are ready (not loading)
        if (!settingsLoading && !prayersLoading && settings?.notifications && hasPrayersTimes) {
            handleAppStartup();
        }
    }, [settingsLoading, prayersLoading]); // Only trigger when loading states change

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