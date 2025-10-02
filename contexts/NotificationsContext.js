import { createContext, useContext, useEffect, useMemo, useRef, useCallback } from "react";
import { Platform } from "react-native";
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
import { useSettingsContext } from "@/contexts/SettingsContext";
import { usePrayersContext } from "@/contexts/PrayersContext";
import useTranslation from "@/hooks/useTranslation";

export const NotificationsContext = createContext();

export function NotificationsProvider({ children }) {
    const PRAYER_ORDER_SHORT = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

    const { appSettings, deviceSettings, settingsLoading } = useSettingsContext();
    const { prayerTimes, prayersLoading, hasPrayerTimes } = usePrayersContext();
    const { tr, language } = useTranslation();

    const isSchedulingRef = useRef(false);
    const isLoading = settingsLoading || prayersLoading;

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
    const cancelPrayerNotifications = useCallback(async () => {
        try {
            const notifications = await notifee.getTriggerNotifications();
            for (const n of notifications) {
                if (n.notification.data?.type === "prayer") {
                    await notifee.cancelNotification(n.notification.id);
                }
            }
            console.log("🔴 All existing prayer notifications cancelled");
        } catch (err) {
            console.error("❌ Failed to cancel prayer notifications", err);
        }
    }, []);

    // ------------------------------------------------------------
    // Check if the currently scheduled notifications match the desired times & language
    // ------------------------------------------------------------
    const isSchedulingUpToDate = async (times) => {
        const scheduled = await notifee.getTriggerNotifications();
        return PRAYER_ORDER_SHORT.every(prayerName => {
            const timeStringRaw = times[prayerName];
            if (!timeStringRaw) return true; // skip missing

            const scheduledNotification = scheduled.find(
                n => n.notification.id === `prayer-${prayerName.toLowerCase()}`
            );
            // not scheduled yet
            if (!scheduledNotification) return false;

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
    const schedulePrayerNotifications = useCallback(async (times) => {
        // Prevent duplicate scheduling - only reschedule if times or language changed
        const isUpToDate = await isSchedulingUpToDate(times)
        if (isUpToDate) {
            console.log("🟢 Prayer notifications already up to date - skipping scheduling");
            return;
        }

        // Prevent concurrent scheduling operations
        if (isSchedulingRef.current) {
            console.log("⭕ Scheduling already in progress - skipping duplicate call");
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

            for (const prayerName of PRAYER_ORDER_SHORT) {
                const timeStringRaw = times[prayerName];
                if (!timeStringRaw) {
                    console.log(`⚠️ No time for ${prayerName}`);
                    continue;
                }

                // Normalize: trim + replace NBSP + Parse "HH:mm" strictly
                const timeString = String(timeStringRaw).replace(/\u00A0/g, " ").trim();
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
                        title: `» ${tr(`prayers.${prayerName}`)} « ${timeString}` || "Prayer time",
                        body: tr("labels.alertBody") || "It's prayer time",
                        data: {
                            type: "prayer",
                            prayer: prayerName,
                            language: language,
                            scheduledAt: new Date().toISOString(),
                            reminderTitle: tr("labels.prayerReminder"),
                            reminderBody: `» ${tr(`prayers.${prayerName}`)} «`,
                        },
                        android: {
                            channelId: "prayer-notifications",
                            smallIcon: 'ic_stat_prayer', // Must exist in drawable android/app/src/main/res/drawable
                            largeIcon: require('../assets/images/prayer-mat-mixed.png'), // Custom large icon
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

                // Debug logging: Format date as DD/MM/YYYY, HH:mm:ss
                const formattedDate = triggerTime.toLocaleDateString('en-GB') + ', ' +
                    triggerTime.toLocaleTimeString('en-GB', { hour12: false });
                console.log(`⏰ Scheduled ${prayerName} at ${formattedDate}`);
            }

            console.log(`🔔 ${scheduledCount} prayer notifications scheduled with language="${language}" and alarmManager="${hasAlarm}"`);
        } catch (err) {
            console.error("❌ Failed to schedule prayer notifications:", err);
        } finally {
            isSchedulingRef.current = false;
        }
    }, [language, tr, cancelPrayerNotifications]);

    // ------------------------------------------------------------
    // Schedule notifications when enabled & prayer times available
    // ------------------------------------------------------------
    useEffect(() => {
        if (isLoading || !deviceSettings) return;

        if (deviceSettings.notificationPermission && hasPrayerTimes) {
            schedulePrayerNotifications(prayerTimes);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading, deviceSettings, prayerTimes, hasPrayerTimes]);

    // ------------------------------------------------------------
    // Foreground event handler for Notifee
    // ------------------------------------------------------------
    useEffect(() => {
        return notifee.onForegroundEvent(async ({ type, detail }) => {
            const { notification, pressAction } = detail;

            // Ignore if no notification
            if (!notification) return;

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
                                            largeIcon: require('../assets/images/past.png'),
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
                    console.log(`👆 [Foreground] Notification pressed for ${notification?.data?.prayer || 'N/A'} - app will open...`);
                    break;
            }
        });
    }, []);

    // ------------------------------------------------------------
    // Memoize context value to prevent unnecessary re-renders
    // ------------------------------------------------------------
    const contextValue = useMemo(() => ({
        schedulePrayerNotifications,
        cancelPrayerNotifications,
    }), [schedulePrayerNotifications, cancelPrayerNotifications]);

    return (
        <NotificationsContext.Provider value={contextValue}>
            {children}
        </NotificationsContext.Provider>
    );
}

export function useNotificationsContext() {
    const context = useContext(NotificationsContext);
    if (context === undefined) {
        throw new Error('useNotificationsContext must be used within a NotificationsProvider');
    }
    return context;
}