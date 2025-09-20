import { useEffect, useRef } from "react";
import { Alert, Linking, Platform } from "react-native";
import notifee, {
    AndroidImportance,
    AndroidVisibility,
    TriggerType,
    RepeatFrequency,
    EventType
} from "@notifee/react-native";
import useTranslation from "@/hooks/useTranslation";

// Constants
const NOTIFICATION_CHANNEL_ID = 'prayer-notifications';
const PRAYER_ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

export default function usePrayerNotifications() {
    const { tr, currentLang } = useTranslation();
    const isInitialized = useRef(false);
    const lastScheduledTimes = useRef(null);

    // ------------------------------------------------------------
    // Initialize Notifee permissions and channels
    // ------------------------------------------------------------
    const initialize = async () => {
        if (isInitialized.current) return true;

        try {
            // Request permission with Notifee
            const settings = await notifee.requestPermission();
            if (settings.authorizationStatus < 1) { // Not authorized
                Alert.alert(
                    tr("labels.notifications"),
                    tr("labels.warning3"),
                    [
                        { text: "Cancel", style: "cancel" },
                        { text: "Open Settings", onPress: () => Linking.openSettings() }
                    ]
                );
                return false;
            }

            // Create Android notification channel with enhanced settings
            if (Platform.OS === "android") {
                await notifee.createChannel({
                    id: NOTIFICATION_CHANNEL_ID,
                    name: 'Prayer Time Notifications',
                    description: 'Notifications for daily prayer times',
                    importance: AndroidImportance.HIGH,
                    visibility: AndroidVisibility.PUBLIC,
                    sound: 'default',
                    vibration: true,
                    vibrationPattern: [300, 500, 300, 500],
                    lights: true,
                    lightColor: '#4A90E2',
                    badge: true,
                    bypassDnd: true, // Bypass Do Not Disturb for prayer times
                });

                // Handle battery optimization
                await handleBatteryOptimization();
            }

            isInitialized.current = true;
            return true;
        } catch (err) {
            console.error("❌ Notifee initialization failed:", err);
            return false;
        }
    };

    // ------------------------------------------------------------
    // Handle battery optimization for better reliability
    // ------------------------------------------------------------
    const handleBatteryOptimization = async () => {
        try {
            const batteryOptimizationEnabled = await notifee.isBatteryOptimizationEnabled();

            if (batteryOptimizationEnabled) {
                // Alert.alert(
                //     "Battery Optimization",
                //     "To ensure prayer notifications work reliably, please disable battery optimization for this app.",
                //     [
                //         { text: "Later", style: "cancel" },
                //         {
                //             text: "Open Settings",
                //             onPress: () => notifee.openBatteryOptimizationSettings()
                //         }
                //     ]
                // );
                console.log("⚠️ Battery optimization is enabled - may affect notification reliability");
            }

            // Check power manager settings
            const powerManagerInfo = await notifee.getPowerManagerInfo();
            if (powerManagerInfo.activity) {
                console.log("⚠️ Power manager detected:", powerManagerInfo.manufacturer);
            }
        } catch (err) {
            console.warn("Battery optimization check failed:", err);
        }
    };

    // ------------------------------------------------------------
    // Show battery optimization guidance to user
    // ------------------------------------------------------------
    const showBatteryOptimizationGuidance = async () => {
        try {
            const batteryOptimizationEnabled = await notifee.isBatteryOptimizationEnabled();

            if (batteryOptimizationEnabled) {
                Alert.alert(
                    "Improve Prayer Notifications",
                    "To ensure you never miss prayer notifications, please disable battery optimization for this app.",
                    [
                        { text: "Later", style: "cancel" },
                        {
                            text: "Open Settings",
                            onPress: () => notifee.openBatteryOptimizationSettings()
                        }
                    ]
                );
            } else {
                Alert.alert("Great!", "Battery optimization is already disabled for reliable notifications.");
            }
        } catch (err) {
            Alert.alert("Settings", "Please check your device's battery optimization settings manually.");
        }
    };

    // ------------------------------------------------------------
    // Enhanced prayer times change detection
    // ------------------------------------------------------------
    const checkPrayerTimesChanged = (newTimes, language = null) => {
        const useLanguage = language || currentLang;
        const newTimesKey = JSON.stringify({ times: newTimes, language: useLanguage });

        if (lastScheduledTimes.current !== newTimesKey) {
            console.log("📅 Prayer times changed - rescheduling needed");
            return true;
        }

        console.log("⏰ Prayer times unchanged - keeping existing schedule");
        return false;
    };

    // ------------------------------------------------------------
    // Cancel all existing prayer notifications
    // ------------------------------------------------------------
    const cancelPrayerNotifications = async () => {
        try {
            // Get all trigger notifications
            const notifications = await notifee.getTriggerNotifications();

            // Cancel only prayer-related notifications
            for (const notification of notifications) {
                if (notification.notification.data?.type === "prayer") {
                    await notifee.cancelNotification(notification.notification.id);
                }
            }

            console.log("⚠️  All existing prayer notifications cancelled");
            lastScheduledTimes.current = null;
        } catch (err) {
            console.error("❌ Failed to cancel prayer notifications", err);
        }
    };

    // ------------------------------------------------------------
    // Schedule prayer notifications
    // ------------------------------------------------------------
    const schedulePrayerNotifications = async (times, language = null, force = false) => {
        // Use passed language or current
        const useLanguage = language || currentLang;

        // Prevent duplicate scheduling and only reschedule if times changed or forced
        if (!force && !checkPrayerTimesChanged(times, useLanguage)) {
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
                const match = timeString.match(/^(\d{1,2}):(\d{2})$/);
                if (!match) {
                    console.warn(`⚠️ Invalid time format for ${name}:`, timeStringRaw);
                    continue;
                }

                // Calculate next occurrence
                const hour = Number(match[1]);
                const minute = Number(match[2]);
                const triggerTime = new Date();
                triggerTime.setHours(hour, minute, 0, 0);

                // If time already passed today, schedule for tomorrow
                if (triggerTime <= now) {
                    triggerTime.setDate(triggerTime.getDate() + 1);
                }

                // Schedule the notification
                await notifee.createTriggerNotification(
                    {
                        id: `prayer-${name.toLowerCase()}`,
                        title: `${tr(`prayers.${name}`)} ${timeString}`,
                        body: tr("labels.alertBody"),
                        data: {
                            type: "prayer",
                            prayer: name,
                            time: timeString,
                            scheduledAt: new Date().toISOString()
                        },
                        android: {
                            channelId: NOTIFICATION_CHANNEL_ID,
                            importance: AndroidImportance.HIGH,
                            smallIcon: 'ic_stat_prayer', // Custom small icon (must exist in drawable android/app/src/main/res/drawable)
                            largeIcon: require('../assets/images/alarm-clock.png'), // Custom large icon
                            color: '#4A90E2',
                            pressAction: {
                                id: 'default',
                                launchActivity: 'default', // Opens the app
                            },
                            actions: [
                                {
                                    title: tr("actions.prayed") || "Prayed",
                                    pressAction: {
                                        id: 'mark-prayed',
                                        launchActivity: 'default'
                                    },
                                    icon: 'ic_check', // Optional: add check icon
                                },
                                {
                                    title: tr("actions.snooze") || "Remind Later",
                                    pressAction: {
                                        id: 'snooze-prayer',
                                        launchActivity: 'default'
                                    },
                                    icon: 'ic_access_time', // Optional: add time icon
                                },
                            ],
                            autoCancel: true, // Auto dismiss when tapped
                            ongoing: false, // Can be dismissed
                        },
                        ios: {
                            categoryId: 'prayer-category',
                            sound: 'default',
                            critical: false, // Set to true for critical alerts
                            interruptionLevel: 'active',
                        }
                    },
                    {
                        type: TriggerType.TIMESTAMP,
                        timestamp: triggerTime.getTime(),
                        alarmManager: true, // Use AlarmManager for reliability
                        repeatFrequency: RepeatFrequency.DAILY, // Repeat daily
                    }
                );

                scheduledCount++;

                // Debugg logging: Format date as DD/MM/YYYY, HH:mm:ss
                const formattedDate = triggerTime.toLocaleDateString('en-GB') + ', ' +
                    triggerTime.toLocaleTimeString('en-GB', { hour12: false });
                console.log(`⏰ Scheduled ${name} at ${formattedDate} (repeating daily with AlarmManager)`);
            }

            // Update the stored times key after successful scheduling
            lastScheduledTimes.current = JSON.stringify({ times, language: useLanguage });

            console.log(`🔔 ${scheduledCount} prayer notifications scheduled with language "${useLanguage}"`);

            // Return success info
            return {
                success: true,
                count: scheduledCount,
                language: useLanguage,
                nextUpdate: "Prayer times will auto-update when changed"
            };
        } catch (err) {
            console.error("❌ Failed to schedule prayer notifications:", err);
            return {
                success: false,
                error: err.message,
                count: 0
            };
        }
    };

    // ------------------------------------------------------------
    // Debug utility: send a test notification
    // ------------------------------------------------------------
    const sendTestNotification = async () => {
        try {
            await initialize();

            await notifee.displayNotification({
                title: `🕌 Test Prayer Notification`,
                body: `${tr("labels.alertBody")} (Test)`,
                data: { type: "test", timestamp: Date.now() },
                android: {
                    channelId: NOTIFICATION_CHANNEL_ID,
                    importance: AndroidImportance.HIGH,
                    smallIcon: 'ic_stat_prayer',
                    largeIcon: require('../assets/images/alarm-clock.png'),
                    color: '#4A90E2',
                    actions: [
                        {
                            title: "Test Action",
                            pressAction: { id: 'test-action' },
                        },
                    ],
                    autoCancel: true,
                },
                ios: {
                    sound: 'default',
                }
            });

            console.log("📱 Test notification sent");
            Alert.alert("Test Sent", "Test notification sent! Check your notification panel.");
        } catch (err) {
            Alert.alert("Error", `Failed to send test notification: ${err.message}`);
            console.error(err);
        }
    };

    // ------------------------------------------------------------
    // Debug utility: list/log all scheduled notifications
    // ------------------------------------------------------------
    const logScheduledNotifications = async () => {
        try {
            const notifications = await notifee.getTriggerNotifications();

            const prayerNotifications = notifications
                .filter(n => n.notification.data?.type === "prayer")
                .map(n => ({
                    id: n.notification.id,
                    title: n.notification.title,
                    body: n.notification.body,
                    prayer: n.notification.data.prayer,
                    time: n.notification.data.time,
                    nextTrigger: new Date(n.trigger.timestamp).toLocaleString(),
                    repeatFrequency: n.trigger.repeatFrequency,
                    alarmManager: n.trigger.alarmManager,
                }));

            console.log("📌 Scheduled prayer notifications:", JSON.stringify(prayerNotifications, null, 2));
            return prayerNotifications;
        } catch (err) {
            console.error("Failed to get scheduled notifications:", err);
            return [];
        }
    };

    // ------------------------------------------------------------
    // Get notification statistics
    // ------------------------------------------------------------
    const getNotificationStats = async () => {
        try {
            const notifications = await notifee.getTriggerNotifications();
            const prayerNotifications = notifications.filter(n => n.notification.data?.type === "prayer");

            return {
                total: prayerNotifications.length,
                prayers: prayerNotifications.map(n => n.notification.data.prayer),
                nextNotification: prayerNotifications.length > 0
                    ? new Date(Math.min(...prayerNotifications.map(n => n.trigger.timestamp)))
                    : null,
                lastScheduled: lastScheduledTimes.current ? new Date(JSON.parse(lastScheduledTimes.current).scheduledAt || Date.now()) : null,
            };
        } catch (err) {
            console.error("Failed to get notification stats:", err);
            return { total: 0, prayers: [], nextNotification: null, lastScheduled: null };
        }
    };

    // ------------------------------------------------------------
    // Foreground event listener
    // ------------------------------------------------------------
    useEffect(() => {
        const unsubscribe = notifee.onForegroundEvent(async ({ type, detail }) => {
            const { notification, pressAction } = detail;

            switch (type) {
                case EventType.DISMISSED:
                    console.log('🔕 Notification dismissed');
                    break;

                case EventType.PRESS:
                    console.log('👆 Notification pressed');
                    break;

                case EventType.ACTION_PRESS:
                    console.log('⚡ Action pressed:', pressAction?.id);

                    switch (pressAction?.id) {
                        case 'mark-prayed':
                            console.log(`✅ Marked ${notification?.data?.prayer} as prayed`);
                            break;

                        case 'snooze-prayer':
                            console.log(`⏰ Snoozed ${notification?.data?.prayer}`);

                            // Schedule 10-minute reminder
                            try {
                                await notifee.createTriggerNotification(
                                    {
                                        id: `prayer-snooze-${notification?.data?.prayer?.toLowerCase()}`,
                                        title: `🔔 Prayer Reminder: ${notification?.data?.prayer}`,
                                        body: "You asked to be reminded about prayer time",
                                        data: { type: "prayer-reminder", prayer: notification?.data?.prayer },
                                        android: {
                                            channelId: NOTIFICATION_CHANNEL_ID,
                                            smallIcon: 'ic_stat_prayer',
                                            largeIcon: require('../assets/images/alarm-clock.png'),
                                            color: '#FF9500',
                                        }
                                    },
                                    {
                                        type: TriggerType.TIMESTAMP,
                                        timestamp: Date.now() + (10 * 60 * 1000), // 10 minutes
                                        alarmManager: true,
                                    }
                                );
                                console.log("🔔 Prayer reminder scheduled for 10 minutes");
                            } catch (err) {
                                console.error("Failed to schedule reminder:", err);
                            }
                            break;

                        case 'test-action':
                            console.log("🧪 Test action pressed");
                            break;
                    }
                    break;
            }
        });

        return () => unsubscribe();
    }, []);

    return {
        // Main functions
        schedulePrayerNotifications,
        cancelPrayerNotifications,

        // Testing & debugging
        sendTestNotification,
        logScheduledNotifications,
        getNotificationStats,

        // Utility functions
        showBatteryOptimizationGuidance,
        checkPrayerTimesChanged,

        // Status
        isInitialized: isInitialized.current,
    };
}