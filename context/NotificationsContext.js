import { createContext, useContext, useEffect, useMemo, useRef, useCallback, useState } from "react";
import { Platform } from "react-native";
import notifee, {
    AndroidImportance,
    AndroidVisibility,
    AndroidNotificationSetting,
    TriggerType,
    RepeatFrequency,
    AndroidColor,
    AndroidStyle
} from "@notifee/react-native";
import { useSettingsContext } from "@/context/SettingsContext";
import { usePrayersContext } from "@/context/PrayersContext";
import { handleNotificationEvent } from '@/services/notificationService';
import useTranslation from "@/hooks/useTranslation";

export const NotificationsContext = createContext();

const PRAYER_ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

export function NotificationsProvider({ children }) {
    const { appSettings, deviceSettings, isReady: settingsReady } = useSettingsContext();
    const { prayerTimes, isReady: prayersReady, hasPrayerTimes } = usePrayersContext();
    const { tr, language } = useTranslation();

    const [isReady, setIsReady] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const isSchedulingRef = useRef(false);

    // Extract config for cleaner dependency tracking
    const notificationsConfig = appSettings?.notificationsConfig;

    // ------------------------------------------------------------
    // Get vibration pattern
    // ------------------------------------------------------------
    const getVibrationMode = useCallback((patternName) => {
        const patterns = {
            off: [],
            short: [500, 300, 500, 300],
            medium: Array(30).fill([1000, 300]).flat(),
            long: Array(60).fill([1000, 300]).flat(),
        };
        return patterns[patternName] || patterns.medium;
    }, []);

    // ------------------------------------------------------------
    // Create notification channels once (Android only)
    // ------------------------------------------------------------
    const createNotificationChannels = useCallback(async () => {
        if (Platform.OS !== "android") return;

        try {
            const vibration = notificationsConfig?.vibration ?? 'medium';
            const pattern = getVibrationMode(vibration);
            const hasVibration = pattern.length > 0;

            const channelConfig = {
                importance: AndroidImportance.HIGH,
                visibility: AndroidVisibility.PUBLIC,
                sound: undefined,
                vibration: hasVibration,
                vibrationPattern: hasVibration ? pattern : undefined,
                lights: true,
                lightColor: AndroidColor.WHITE,
                badge: true,
                autoCancel: false,
                ongoing: true,
                bypassDnd: true,
            };

            // Use vibrationMode in channel IDs
            const notificationsChannelId = `prayer-notifications-channel-${vibration}`;
            const remindersChannelId = `prayer-reminders-channel-${vibration}`;

            // Create prayer-notifications Channel
            await notifee.createChannel({
                id: notificationsChannelId,
                name: "Prayer Time Notifications",
                description: "Notifications for daily prayer times",
                ...channelConfig,
            });
            // Create prayer-reminders Channel
            await notifee.createChannel({
                id: remindersChannelId,
                name: 'Prayer Time Reminders',
                description: "Reminder for daily prayer times",
                ...channelConfig,
            });

            console.log(`✅ Created channels with vibration: ${vibration}`);
        } catch (err) {
            console.error("❌ Failed to create notification channels:", err);
        }
    }, [notificationsConfig, getVibrationMode]);

    // ------------------------------------------------------------
    // Cancel all existing prayer notifications && remove channels
    // ------------------------------------------------------------
    const cancelPrayerNotifications = useCallback(async () => {
        setIsLoading(true);
        try {
            // 1) Cancel scheduled trigger notifications that belong to our app and match types
            const scheduled = await notifee.getTriggerNotifications();
            for (const n of scheduled) {
                const type = n.notification.data?.type;
                if (type === 'prayer-notification' || type === 'prayer-reminder') {
                    await notifee.cancelNotification(n.notification.id);
                }
            }

            // 2) Remove any existing channels that match our prefixes
            const allChannels = await notifee.getChannels();
            const toDelete = allChannels.map(c => c.id).filter(
                id => id && (id.startsWith('prayer-notifications-channel') || id.startsWith('prayer-reminders-channel'))
            );
            for (const id of toDelete) {
                try {
                    await notifee.deleteChannel(id);
                    console.log(`🗑️ Deleted channel: ${id}`);
                } catch (err) {
                    console.warn(`⚠️ Failed to delete channel ${id}:`, err);
                }
            }

            console.log('🔴 All existing prayer notifications cancelled & prayer channels removed (if any)');
        } catch (err) {
            console.error("❌ Failed to cancel prayer notifications && to remove prayer channels", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ------------------------------------------------------------
    // Check if notifications need rescheduling
    // Returns true if rescheduling is needed
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
                const currentVolume = String(notificationsConfig?.soundVolume ?? 1);
                const currentVibration = String(notificationsConfig?.vibration ?? "long");
                const currentSnooze = String(notificationsConfig?.snoozeTimeout ?? 5);
                // Check if notification config hasn't changed
                if (notifData.soundVolume !== currentVolume) return false;
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
            console.log("⭕ Scheduling already in progress - skipping duplicate call");
            return;
        }

        // Prevent duplicate scheduling - only reschedule if times or language changed
        const isUpToDate = await shouldReschedule(times)
        if (isUpToDate) {
            console.log("✔ Prayer notifications already up to date");
            return;
        }

        try {
            isSchedulingRef.current = true;
            setIsLoading(true);

            // Cancel all existing notifications
            await cancelPrayerNotifications();
            // Create Channels (Android only)
            await createNotificationChannels();

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
                            soundVolume: String(notificationsConfig?.soundVolume ?? 1.0),
                            vibration: notificationsConfig?.vibration ?? "medium",
                            snoozeTimeout: String(notificationsConfig?.snoozeTimeout ?? 5),
                        },
                        android: {
                            channelId: `prayer-notifications-channel-${notificationsConfig?.vibration ?? 'medium'}`,
                            showTimestamp: true,
                            smallIcon: 'ic_stat_prayer', // Must exist in drawable android/app/src/main/res/drawable
                            largeIcon: require('../assets/images/moon-islam.png'), // Custom large icon
                            color: AndroidColor.OLIVE,
                            pressAction: { id: 'default', launchActivity: 'default' },
                            actions: [
                                { title: tr("actions.prayed"), pressAction: { id: 'mark-prayed' } },
                                { title: tr("actions.remindLater"), pressAction: { id: 'snooze-prayer' } },
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
            if (deviceSettings?.notificationPermission && hasPrayerTimes) {
                await schedulePrayerNotifications(prayerTimes);
            }
        })();

        if (mounted) setIsReady(true);

        return () => { mounted = false; };
    }, [settingsReady, appSettings, deviceSettings?.notificationPermission, prayersReady, prayerTimes, hasPrayerTimes]);

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