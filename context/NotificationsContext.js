import { createContext, useContext, useEffect, useMemo, useRef, useCallback, useState } from "react";
import notifee, { AndroidNotificationSetting, TriggerType, RepeatFrequency, AndroidColor, AndroidStyle } from "@notifee/react-native";
import { useSettingsContext } from "@/context/SettingsContext";
import { usePrayersContext } from "@/context/PrayersContext";
import { cancelPrayerNotifications, createNotificationChannels, handleNotificationEvent } from '@/services/notificationService';
import useTranslation from "@/hooks/useTranslation";

export const NotificationsContext = createContext();

const PRAYER_ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

export function NotificationsProvider({ children }) {
    const { appSettings, deviceSettings, isReady: settingsReady } = useSettingsContext();
    const { prayerTimes, isReady: prayersReady } = usePrayersContext();
    const { tr, language } = useTranslation();

    const [isReady, setIsReady] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const isSchedulingRef = useRef(false);

    // Extract config for cleaner dependency tracking
    const notificationsConfig = appSettings?.notificationsConfig;

    // ------------------------------------------------------------
    // Check if notifications need rescheduling
    // ------------------------------------------------------------
    const shouldReschedule = useCallback(async (times) => {
        try {
            // Get all currently scheduled notifications
            const scheduled = await notifee.getTriggerNotifications();

            // Check each prayer in order
            return PRAYER_ORDER.every(prayerName => {
                // Skip prayers without a time
                const timeString = times[prayerName];
                if (!timeString) return true;

                // Find the scheduled notification
                const notification = scheduled.find(
                    n => n.notification.id === `prayer-${prayerName.toLowerCase()}`
                );
                if (!notification) return false; // needs scheduling

                const notifData = notification.notification.data;

                // Check if language hasn't changed
                if (notifData.language !== language) return false;

                // Convert to strings for comparison (saved data is always string)
                const currentVolume = String(notificationsConfig?.volume ?? 1);
                const currentVibration = String(notificationsConfig?.vibration ?? 'on');
                const currentSnooze = String(notificationsConfig?.snoozeTimeout ?? 5);
                // Check if notification config hasn't changed
                if (notifData.volume !== currentVolume) return false;
                if (notifData.vibration !== currentVibration) return false;
                if (notifData.snoozeTimeout !== currentSnooze) return false;

                // Check if prayer time hasn't changed
                const [hourStr, minuteStr] = timeString.split(":");
                const hour = Number(hourStr);
                const minute = Number(minuteStr);

                // Calculate expected trigger time
                const now = new Date();
                const targetTime = new Date();
                targetTime.setHours(hour, minute, 0, 0);

                // If time already passed today, it should be scheduled for tomorrow
                if (targetTime <= now) targetTime.setDate(targetTime.getDate() + 1);

                // Compare scheduled timestamp with expected timestamp
                if (notification.trigger.timestamp !== targetTime.getTime()) return false;

                return true; // All checks passed
            });
        } catch (err) {
            console.error("❌ Failed to check notifications schedule:", err);
            return false; // On error, needs rescheduling
        }
    }, [language, notificationsConfig]);

    // ------------------------------------------------------------
    // Schedule prayer notifications
    // ------------------------------------------------------------
    const schedulePrayerNotifications = useCallback(async (times) => {
        // Prevent concurrent scheduling operations
        if (isSchedulingRef.current) {
            console.log("🔴 Scheduling already in progress - skipping");
            return;
        }

        // Prevent duplicate scheduling - only reschedule if times or language changed
        const isUpToDate = await shouldReschedule(times)
        if (isUpToDate) {
            console.log("🟤 Prayer notifications already up to date");
            return;
        }

        isSchedulingRef.current = true;
        setIsLoading(true);
        try {
            // Cancel all existing notifications
            await cancelPrayerNotifications();
            // Create Channels (Android only)
            await createNotificationChannels(notificationsConfig);

            // Check Alarm & Reminders permission
            const settings = await notifee.getNotificationSettings();
            const hasAlarm = settings.android.alarm === AndroidNotificationSetting.ENABLED;

            let scheduledCount = 0;
            const now = new Date();

            for (const prayerName of PRAYER_ORDER) {
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

                // Schedule notification
                await notifee.createTriggerNotification(
                    {
                        id: `prayer-${prayerName.toLowerCase()}`,
                        title: `» ${tr(`prayers.${prayerName}`)} «`,
                        body: `${tr("labels.alertBody")} (${timeString})`,
                        data: {
                            type: "prayer-notification",
                            prayer: prayerName,
                            reminderTitle: `» ${tr(`prayers.${prayerName}`)} «`,
                            reminderBody: tr("labels.prayerReminder"),
                            language: language,
                            volume: String(notificationsConfig?.volume ?? 1.0),
                            vibration: notificationsConfig?.vibration ?? 'on',
                            snoozeTimeout: String(notificationsConfig?.snoozeTimeout ?? 5),
                        },
                        android: {
                            channelId: `prayer-notif-channel-vib-${notificationsConfig?.vibration ?? 'on'}`,
                            showTimestamp: true,
                            smallIcon: 'ic_stat_prayer', // Must exist in android/app/src/main/res/drawable
                            largeIcon: require('../assets/images/moon-islam.png'), // Custom large icon
                            color: AndroidColor.OLIVE,
                            pressAction: { id: 'default', launchActivity: 'default' },
                            actions: [
                                { title: tr("actions.dismiss"), pressAction: { id: 'dismiss' } },
                                { title: tr("actions.snooze"), pressAction: { id: 'snooze' } },
                            ],
                            style: {
                                type: AndroidStyle.INBOX, // Show all action buttons immediately
                                lines: [`${tr("labels.alertBody")} (${timeString})`],
                            },
                            autoCancel: false,
                            ongoing: true,
                        },
                        ios: {
                            categoryId: 'prayer-category',
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

            console.log(`🔔 ${scheduledCount} notifications scheduled`);
        } catch (err) {
            console.error("❌ Failed to schedule notifications:", err);
        } finally {
            isSchedulingRef.current = false;
            setIsLoading(false);
        }
    }, [language, tr, notificationsConfig, shouldReschedule, cancelPrayerNotifications, createNotificationChannels]);

    // ------------------------------------------------------------
    // Auto-load on mount (only if settingsReady and PrayersReady)
    // ------------------------------------------------------------
    useEffect(() => {
        if (!settingsReady || !prayersReady) return;

        let mounted = true;

        (async () => {
            if (deviceSettings?.notificationPermission && prayerTimes) {
                await schedulePrayerNotifications(prayerTimes);
            }
        })();

        if (mounted) setIsReady(true);

        return () => { mounted = false; };
    }, [settingsReady, appSettings, deviceSettings?.notificationPermission, prayersReady, prayerTimes]);

    // ------------------------------------------------------------
    // Foreground event handler for Notifee
    // ------------------------------------------------------------
    useEffect(() => {
        return notifee.onForegroundEvent(async ({ type, detail }) => {
            const { notification, pressAction } = detail;
            if (!notification) return;
            await handleNotificationEvent(type, notification, pressAction, 'foreground');
        });
    }, []);

    // ------------------------------------------------------------
    // Memoize context value
    // ------------------------------------------------------------
    const contextValue = useMemo(() => ({
        schedulePrayerNotifications,
        cancelPrayerNotifications,
        isReady,
        isLoading,
    }), [schedulePrayerNotifications, cancelPrayerNotifications, isReady, isLoading]);

    return (
        <NotificationsContext.Provider value={contextValue}>
            {children}
        </NotificationsContext.Provider>
    );
}

export function useNotificationsContext() {
    const context = useContext(NotificationsContext);
    if (!context) throw new Error('useNotificationsContext must be used within a NotificationsProvider');
    return context;
}