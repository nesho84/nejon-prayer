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

export default function useNotifications() {
    const { tr, language } = useTranslation();

    const isSchedulingRef = useRef(false);

    // Custom prayers order
    const PRAYER_ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

    // ------------------------------------------------------------
    // Create notification channel (Android only)
    // ------------------------------------------------------------
    const createNotificationChannel = async () => {
        if (Platform.OS !== "android") return;

        try {
            await notifee.createChannel({
                id: "prayer-notifications",
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

            console.log("⚠️ All existing prayer notifications cancelled");
        } catch (err) {
            console.error("❌ Failed to cancel prayer notifications", err);
        }
    };

    // ------------------------------------------------------------
    // Check if the currently scheduled notifications match the desired times & language
    // ------------------------------------------------------------
    const isSchedulingUpToDate = async (times) => {
        const scheduled = await notifee.getTriggerNotifications();

        return PRAYER_ORDER.every(prayerName => {
            const timeStringRaw = times[prayerName];
            if (!timeStringRaw) return true; // skip missing

            const scheduledNotification = scheduled.find(n => n.notification.id === `prayer-${prayerName.toLowerCase()}`);
            if (!scheduledNotification) return false; // not scheduled yet

            // Check language
            if (scheduledNotification.notification.data.language !== language) return false;

            // Compare trigger timestamp
            const [hourStr, minuteStr] = timeStringRaw.split(":");
            const hour = Number(hourStr);
            const minute = Number(minuteStr);

            const now = new Date();
            const targetTime = new Date();
            targetTime.setHours(hour, minute, 0, 0);
            if (targetTime <= now) targetTime.setDate(targetTime.getDate() + 1);

            const triggerTimestamp = scheduledNotification.trigger.timestamp;

            return triggerTimestamp === targetTime.getTime();
        });
    };

    // ------------------------------------------------------------
    // Schedule prayer notifications
    // ------------------------------------------------------------
    const schedulePrayerNotifications = async (times) => {
        // Prevent duplicate scheduling - only reschedule if times or language changed
        const isUpdaToDate = await isSchedulingUpToDate(times)
        if (isUpdaToDate) {
            console.log("🟢 Prayer notifications already up to date - skipping scheduling");
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

            for (const prayerName of PRAYER_ORDER) {
                const timeStringRaw = times[prayerName];
                if (!timeStringRaw) {
                    console.log(`⚠️ No time for ${prayerName}`);
                    continue;
                }

                // Normalize: trim + replace NBSP
                const timeString = String(timeStringRaw).replace(/\u00A0/g, " ").trim();
                // Parse "HH:mm" strictly
                const match = timeString.match(/^(\d{1,2}):(\d{2})$/);
                if (!match) {
                    console.warn(`⚠️ Invalid time format for ${prayerName}:`, timeStringRaw);
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
                        id: `prayer-${prayerName.toLowerCase()}`,
                        title: `${tr(`prayers.${prayerName}`)} ${timeString}` || "Prayer time",
                        body: tr("labels.alertBody") || "It's prayer time",
                        data: {
                            type: "prayer",
                            prayer: prayerName,
                            language: language,
                            scheduledAt: new Date().toISOString(),
                            reminderTitle: tr("labels.prayerReminder"),
                            reminderBody: `${tr("labels.timeFor")} ${tr(`prayers.${prayerName}`)}`,
                        },
                        android: {
                            channelId: "prayer-notifications",
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
                console.log(`⏰ Scheduled ${prayerName} at ${formattedDate}`);
            }

            console.log(`🔔 ${scheduledCount} prayer notifications scheduled with language="${language}" and alarmManager="${hasAlarm}"`);
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
                    id: `prayer-test`,
                    title: `${tr(`prayers.Fajr`)} 5:30` || "Prayer time",
                    body: tr("labels.alertBody") || "It's prayer time",
                    data: {
                        type: "prayer",
                        prayer: "Fajr",
                        language: language,
                        scheduledAt: new Date().toLocaleString("en-GB"),
                        reminderTitle: tr("labels.prayerReminder"),
                        reminderBody: `${tr("labels.timeFor")} ${tr(`prayers.Fajr`)}`,
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

            console.log(`🔔 Notification scheduled with language="${language}" and alarmManager="${hasAlarm}"`);
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

            // Handle event types
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
                                        id: `prayer-snooze-${notification?.data?.prayer}`,
                                        title: notification?.data?.reminderTitle,
                                        body: notification?.data?.reminderBody,
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