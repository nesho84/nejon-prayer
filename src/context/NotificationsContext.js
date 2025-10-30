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

    // Prevent concurrent scheduling operations
    const isSchedulingRef = useRef(false);

    // Extract config for cleaner dependency tracking
    const notificationsConfig = appSettings?.notificationsConfig;

    // ------------------------------------------------------------
    // Check if notifications need rescheduling & clean up disabled ones
    // Returns: true if all enabled notifications are up-to-date, false if rescheduling needed
    // ------------------------------------------------------------
    const syncPrayerNotifications = useCallback(async (times) => {
        try {
            // Get all currently scheduled notifications
            const scheduled = await notifee.getTriggerNotifications();

            // Step 1: Remove notifications for prayers that are disabled
            for (const { notification } of scheduled) {
                const prayer = notification?.data?.prayer;
                if (prayer && notificationsConfig?.prayers?.[prayer] === false) {
                    await notifee.cancelTriggerNotification(notification.id);
                    console.log(`🚫 Removed Notification for the prayer: ${prayer}`);
                }
            }

            // Step 2: Check if remaining enabled prayers are up-to-date
            const areUpToDate = PRAYER_ORDER.every(prayerName => {
                const timeString = times[prayerName];

                // Skip prayers without a time
                if (!timeString) return true;

                // Skip prayers disabled by user
                if (notificationsConfig?.prayers?.[prayerName] === false) return true;

                // Find scheduled notification
                const notification = scheduled.find(
                    n => n.notification.id === `prayer-${prayerName.toLowerCase()}`
                );

                // Not scheduled yet - needs rescheduling
                if (!notification) return false;

                // Extract Notification data
                const notifData = notification.notification.data;

                // Check if notification config has changed
                const currentVolume = String(notificationsConfig?.volume ?? 1);
                if (notifData.volume !== currentVolume) return false;
                const currentVibration = String(notificationsConfig?.vibration ?? 'on');
                if (notifData.vibration !== currentVibration) return false;
                const currentSnooze = String(notificationsConfig?.snooze ?? 5);
                if (notifData.snooze !== currentSnooze) return false;

                // Check if language has changed
                if (notifData.language !== language) return false;

                // Check if prayer time has changed
                const [hourStr, minuteStr] = timeString.split(":");
                const hour = Number(hourStr);
                const minute = Number(minuteStr);

                // Calculate expected trigger time
                const now = new Date();
                const targetTime = new Date();
                targetTime.setHours(hour, minute, 0, 0);

                // If time passed today, should be scheduled for tomorrow
                if (targetTime <= now) {
                    targetTime.setDate(targetTime.getDate() + 1);
                }

                // Compare scheduled timestamp with expected timestamp
                if (notification.trigger.timestamp !== targetTime.getTime()) {
                    return false;
                }

                // All enabled notifications are up-to-date
                return true;
            });

            return areUpToDate;
        } catch (err) {
            console.error('Error during notification delete/reschedule check:', err);
            return false; // Force reschedule on error
        }
    }, [language, notificationsConfig]);

    // ------------------------------------------------------------
    // Schedule prayer notifications for all enabled prayers
    // ------------------------------------------------------------
    const schedulePrayerNotifications = useCallback(async (times) => {
        // Prevent concurrent scheduling
        if (isSchedulingRef.current) {
            console.log("⏸️ Scheduling already in progress - skipping");
            return;
        }

        // Check if rescheduling is needed
        const isUpToDate = await syncPrayerNotifications(times);
        if (isUpToDate) {
            console.log("✅ Prayer notifications synced - no scheduling needed");
            return;
        }

        isSchedulingRef.current = true;
        setIsLoading(true);
        try {
            // Cancel all existing notifications
            await cancelPrayerNotifications();
            // Create Channels (Android only)
            await createNotificationChannels(notificationsConfig);

            // Check if alarm manager permission is granted
            const settings = await notifee.getNotificationSettings();
            const hasAlarm = settings.android.alarm === AndroidNotificationSetting.ENABLED;

            let scheduledCount = 0;
            const now = new Date();

            // Schedule notifications for each enabled prayer
            for (const prayerName of PRAYER_ORDER) {
                // Skip disabled prayers
                if (!notificationsConfig?.prayers?.[prayerName]) continue;

                const timeStringRaw = times[prayerName];
                if (!timeStringRaw) {
                    console.log(`⚠️ No time available for ${prayerName}`);
                    continue;
                }

                // Normalize time string: trim + replace NBSP + Parse "HH:mm" strictly
                const timeString = String(timeStringRaw).replace(/\u00A0/g, " ").trim();
                const match = timeString.match(/^(\d{1,2}):(\d{2})$/);
                if (!match) {
                    console.warn(`⚠️ Invalid time format for ${prayerName}:`, timeStringRaw);
                    continue;
                }

                // Calculate trigger time
                const hour = Number(match[1]);
                const minute = Number(match[2]);
                const triggerTime = new Date();
                triggerTime.setHours(hour, minute, 0, 0);

                // If time has passed today, schedule for tomorrow
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
                            snooze: String(notificationsConfig?.snooze ?? 5),
                        },
                        android: {
                            channelId: `prayer-notif-channel-vib-${notificationsConfig?.vibration ?? 'on'}`,
                            showTimestamp: true,
                            smallIcon: 'ic_stat_prayer', // Must exist in android/app/src/main/res/drawable
                            largeIcon: require('../../assets/images/moon-islam.png'), // Custom large icon
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

                // Log scheduled time: Format date as DD/MM/YYYY, HH:mm:ss
                const formattedDate = triggerTime.toLocaleDateString('en-GB') + ', ' +
                    triggerTime.toLocaleTimeString('en-GB', { hour12: false });
                console.log(`⏰ Scheduled ${prayerName} at ${formattedDate}`);
            }

            console.log(`🔔 Successfully scheduled ${scheduledCount} prayer notification(s)`);
        } catch (err) {
            console.error("❌ Failed to schedule notifications:", err);
        } finally {
            isSchedulingRef.current = false;
            setIsLoading(false);
        }
    }, [language, tr, notificationsConfig, syncPrayerNotifications, cancelPrayerNotifications, createNotificationChannels]);

    // ------------------------------------------------------------
    // Auto-Schedule notifications when contexts are ready and permission granted
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
    }, [
        settingsReady,
        appSettings,
        deviceSettings?.notificationPermission,
        prayersReady,
        prayerTimes
    ]);

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
    // Memoize context value to prevent unnecessary re-renders
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