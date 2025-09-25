import { useEffect, useRef } from "react";
import { Alert, Platform } from "react-native";
import notifee, {
    AndroidImportance,
    AndroidVisibility,
    AndroidNotificationSetting,
    TriggerType,
    RepeatFrequency,
    EventType,
    AndroidColor,
    AndroidStyle
} from "@notifee/react-native";
import useTranslation from "@/hooks/useTranslation";

// Constants
const NOTIFICATION_CHANNEL_ID = 'prayer-notifications';
const PRAYER_ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

export default function useNotifications() {
    const { tr, currentLang } = useTranslation();
    const lastScheduledTimes = useRef(null);
    const isSchedulingRef = useRef(false);

    // ------------------------------------------------------------
    // Create notification channel (Android only)
    // ------------------------------------------------------------
    const createNotificationChannel = async () => {
        if (Platform.OS !== "android") return;

        try {
            await notifee.createChannel({
                id: NOTIFICATION_CHANNEL_ID,
                name: "Prayer Time Notifications",
                description: "Notifications for daily prayer times",
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
        } catch (err) {
            console.error("❌ Failed to create notification channel:", err);
        }
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

        // Create a unique key for this scheduling request
        const timesKey = JSON.stringify({ times, language: useLanguage });

        // Prevent duplicate scheduling - only reschedule if times changed or forced
        if (!force && lastScheduledTimes.current === timesKey) {
            console.log("🟢 Prayer times unchanged - keeping existing scheduled Notifications");
            return;
        }

        // Prevent concurrent scheduling operations
        if (isSchedulingRef.current) {
            console.log("🟡 Scheduling already in progress - skipping duplicate call");
            return;
        }

        try {
            // Set scheduling lock
            isSchedulingRef.current = true;

            // Cancel existing notifications
            await cancelPrayerNotifications();

            // Create Channel (Android only)
            await createNotificationChannel();

            // Check Alarm & Reminders permission
            const settings = await notifee.getNotificationSettings();
            const hasAlarm = settings.android.alarm === AndroidNotificationSetting.ENABLED;

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
                        title: `${tr(`prayers.${name}`)} ${timeString}` || "Prayer time",
                        body: tr("labels.alertBody") || "It's prayer time",
                        data: {
                            type: "prayer",
                            prayer: name,
                            time: timeString,
                            scheduledAt: new Date().toISOString()
                        },
                        android: {
                            channelId: NOTIFICATION_CHANNEL_ID,
                            smallIcon: 'ic_stat_prayer', // Must exist in drawable android/app/src/main/res/drawable
                            largeIcon: require('../assets/images/alarm-clock.png'), // Custom large icon
                            color: AndroidColor.RED,
                            pressAction: { id: 'default', launchActivity: 'default' },
                            actions: [
                                {
                                    title: tr("actions.prayed") || "Prayed",
                                    pressAction: { id: 'mark-prayed' },
                                },
                                {
                                    title: tr("actions.remindLater") || "Remind Later",
                                    pressAction: { id: 'snooze-prayer' },
                                },
                            ],
                            style: {
                                type: AndroidStyle.INBOX, // Show all action buttons immediately
                                lines: [`${tr("labels.alertBody") || "It's prayer time"}`],
                            },
                            autoCancel: true, // Auto dismiss when tapped
                            ongoing: false, // Can be dismissed
                        },
                        ios: {
                            categoryId: 'prayer-category',
                            sound: 'default',
                            critical: false,
                            interruptionLevel: 'active',
                        }
                    },
                    {
                        type: TriggerType.TIMESTAMP,
                        timestamp: triggerTime.getTime(),
                        alarmManager: hasAlarm,
                        repeatFrequency: RepeatFrequency.DAILY,
                    }
                );

                scheduledCount++;

                // Debugg logging: Format date as DD/MM/YYYY, HH:mm:ss
                const formattedDate = triggerTime.toLocaleDateString('en-GB') + ', ' +
                    triggerTime.toLocaleTimeString('en-GB', { hour12: false });
                console.log(`⏰ Scheduled ${name} at ${formattedDate} (alarmManager=${hasAlarm})`);
            }

            // Update the stored times key after successful scheduling
            lastScheduledTimes.current = JSON.stringify({ times, language: useLanguage });

            console.log(`🔔 ${scheduledCount} prayer notifications scheduled with language "${useLanguage}"`);
        } catch (err) {
            console.error("❌ Failed to schedule prayer notifications:", err);
        } finally {
            // Always release the scheduling lock
            isSchedulingRef.current = false;
        }
    };

    // ------------------------------------------------------------
    // Debug utility: send a test notification
    // ------------------------------------------------------------
    const scheduleTestNotification = async () => {
        try {
            const timestamp = Date.now() + (10 * 1000); // 10 sec.

            // Get Run Alarm & Reminders permission
            const settings = await notifee.getNotificationSettings();
            const hasAlarm = settings.android.alarm === AndroidNotificationSetting.ENABLED;

            // Create test-specific channel
            await notifee.createChannel({
                id: 'test-notifcations',
                name: 'Test Notifcations',
                description: "Notifications for daily prayer times",
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

            // Schedule timestamp reminder
            await notifee.createTriggerNotification(
                {
                    id: 'simple-test',
                    title: `${tr("prayers.Fajr") || "Fajr"} 05:30`,
                    body: tr("labels.alertBody") || "It's prayer time",
                    data: {
                        type: "prayer",
                        prayer: "Fajr",
                        time: "05:30",
                        scheduledAt: new Date().toISOString()
                    },
                    android: {
                        channelId: 'test-notifcations',
                        smallIcon: 'ic_stat_prayer', // Must exist in drawable android/app/src/main/res/drawable
                        largeIcon: require('../assets/images/alarm-clock.png'), // Custom large icon
                        color: AndroidColor.RED,
                        pressAction: { id: 'default', launchActivity: 'default' },
                        actions: [
                            {
                                title: tr("actions.prayed") || "Prayed",
                                pressAction: { id: 'mark-prayed' },
                                // icon: 'ic_check',
                            },
                            {
                                title: tr("actions.remindLater") || "Remind Later",
                                pressAction: { id: 'snooze-prayer' },
                                // icon: 'ic_access_time',
                            },
                        ],
                        style: {
                            type: AndroidStyle.INBOX, // Show all action buttons immediately
                            lines: [`${tr("labels.alertBody") || "It's prayer time"}`],
                        },
                        autoCancel: true, // Auto dismiss when tapped
                        ongoing: false, // Can be dismissed
                    },
                    ios: {
                        categoryId: 'prayer-category',
                        critical: false,
                        interruptionLevel: 'active',
                    }
                },
                {
                    type: TriggerType.TIMESTAMP,
                    timestamp: timestamp,
                    alarmManager: hasAlarm,
                }
            );

            // Convert timestamp to seconds
            const remainingSeconds = Math.max(0, Math.floor((timestamp - Date.now()) / 1000) + 1);
            Alert.alert(
                `Test Notification scheduled`,
                `Test notification will appear in ${remainingSeconds} seconds. Try the action buttons!`
            );
        } catch (err) {
            Alert.alert("Error", `Failed to schedule test notification: ${err.message}`);
            console.error(err);
        }
    };

    // ------------------------------------------------------------
    // Foreground event handler for Notifee
    // ------------------------------------------------------------
    useEffect(() => {
        return notifee.onForegroundEvent(async ({ type, detail }) => {
            const { notification, pressAction } = detail;

            // Ignore if no notification
            if (!notification) return;

            // console.log(`🌞 [Foreground] Notification event fired: (prayer: "${notification?.data?.prayer || 'N/A'}")`);

            // Check Alarm & Reminders permission
            const settings = await notifee.getNotificationSettings();
            const hasAlarm = settings.android.alarm === AndroidNotificationSetting.ENABLED;

            switch (type) {
                case EventType.ACTION_PRESS:
                    switch (pressAction?.id) {
                        case 'mark-prayed':
                            console.log(`✅ [Foreground] Marked "${notification?.data?.prayer}" as prayed`);
                            break;
                        case 'snooze-prayer':
                            console.log(`⏰ [Foreground] Snoozed "${notification?.data?.prayer}"`);

                            try {
                                // Create reminder-specific channel
                                await notifee.createChannel({
                                    id: 'prayer-reminders',
                                    name: 'Prayer Reminders',
                                    description: "Reminder for daily prayer times",
                                    importance: AndroidImportance.HIGH,
                                    visibility: AndroidVisibility.PUBLIC,
                                    sound: 'default',
                                    vibration: true,
                                    bypassDnd: true,
                                });
                                // Schedule timestamp reminder
                                await notifee.createTriggerNotification(
                                    {
                                        id: `prayer-snooze-${notification?.data?.prayer || 'unknown'}`,
                                        title: tr("labels.prayerReminder") || "Prayer Reminder",
                                        body: `${tr("labels.timeFor") || "Time for"} ${tr(`prayers.${notification?.data?.prayer}`) || notification?.data?.prayer || "prayer"}`,
                                        data: { type: "prayer-reminder" },
                                        android: {
                                            channelId: 'prayer-reminders',
                                            smallIcon: 'ic_stat_prayer',
                                            largeIcon: require('../assets/images/alarm-clock.png'),
                                            color: AndroidColor.RED,
                                            pressAction: { id: 'default', launchActivity: 'default' },
                                        }
                                    },
                                    {
                                        type: TriggerType.TIMESTAMP,
                                        timestamp: Date.now() + (10 * 60 * 1000), // 10 minutes
                                        alarmManager: hasAlarm,
                                    }
                                );
                                console.log(`🔔 [Foreground] Prayer reminder scheduled for "${notification?.data?.prayer}"`);
                            } catch (err) {
                                console.error("❌ [Foreground] Failed to schedule snooze reminder:", err);
                            }
                            break;
                    }
                    break;
                case EventType.PRESS:
                    console.log(`👆 [Foreground] Notification pressed for ${notification?.data?.prayer || 'N/A'} - app will open...")`);
                    break;
            }
        });
    }, []);

    return {
        schedulePrayerNotifications,
        cancelPrayerNotifications,
        scheduleTestNotification,
    };
}