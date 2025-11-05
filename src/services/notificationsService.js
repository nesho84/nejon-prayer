import { startSound, stopSound } from "@/utils/notifSound";
import notifee, {
    EventType,
    AndroidNotificationSetting,
    AndroidImportance,
    AndroidVisibility,
    TriggerType,
    RepeatFrequency,
    AndroidColor,
    AndroidStyle
} from '@notifee/react-native';
import { Platform } from 'react-native';

const PRAYER_ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

// ------------------------------------------------------------
// Create notification channels once (Android only)
// ------------------------------------------------------------
export const createNotificationChannels = async (notifSettings) => {
    if (Platform.OS !== 'android') return;

    try {
        const vibration = notifSettings?.vibration ?? 'on';
        const isEnabled = vibration === 'on';
        const pattern = Array(30).fill([1000, 300]).flat(); // 30s total, 15 cycles of 1s on / 300ms off

        const channelConfig = {
            importance: AndroidImportance.HIGH,
            visibility: AndroidVisibility.PUBLIC,
            sound: undefined, // handled manually
            vibration: isEnabled,
            vibrationPattern: isEnabled ? pattern : undefined,
            lights: true,
            lightColor: AndroidColor.WHITE,
            badge: true,
            autoCancel: false,
            ongoing: true,
            bypassDnd: true,
        };

        // Create prayer-notifications Channel
        await notifee.createChannel({
            id: `prayer-notif-channel-vib-${vibration}`,
            name: "Prayer Notifications",
            description: "Notifications for daily prayer times",
            ...channelConfig,
        });
        // Create prayer-reminders Channel
        await notifee.createChannel({
            id: `prayer-remind-channel-vib-${vibration}`,
            name: 'Prayer Reminders',
            description: "Reminder for daily prayer times",
            ...channelConfig,
        });
    } catch (err) {
        console.error("❌ Failed to create notification channels:", err);
    }
};

// ------------------------------------------------------------
// Cancel all scheduled prayer notifications
// ------------------------------------------------------------
export const cancelPrayerNotifications = async () => {
    try {
        const scheduled = await notifee.getTriggerNotifications();
        for (const n of scheduled) {
            const type = n.notification.data?.type;
            if (type === 'prayer-notification' || type === 'prayer-reminder') {
                await notifee.cancelTriggerNotification(n.notification.id);
            }
        }
        console.log('🔴 All existing notifications cancelled');
    } catch (err) {
        console.error("❌ Failed to cancel notifications", err);
    }
};

// ------------------------------------------------
// Cancel everything: stop sound + remove notification
// ------------------------------------------------
async function cancelDisplayedNotification(notificationId) {
    try {
        await notifee.cancelNotification(notificationId);
        await stopSound();
    } catch (err) {
        console.error('❌ [Cleanup] Failed to clear:', err);
    }
}

// ------------------------------------------------------------
// Parse a time string and return trigger time (today or tomorrow)
// ------------------------------------------------------------
export function getTriggerTime(timeStringRaw, prayerName) {
    // Normalize: trim + replace NBSP + parse "HH:mm" strictly
    const timeString = String(timeStringRaw).replace(/\u00A0/g, " ").trim();
    const match = timeString.match(/^(\d{1,2}):(\d{2})$/);

    if (!match) {
        console.warn(`⚠️ Invalid time format for ${prayerName}:`, timeStringRaw);
        return null;
    }

    // Calculate trigger time
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    const triggerTime = new Date();
    triggerTime.setHours(hour, minute, 0, 0);

    // If time has passed today, schedule for tomorrow
    const now = new Date();
    if (triggerTime <= now) {
        triggerTime.setDate(triggerTime.getDate() + 1);
    }

    return triggerTime;
}

// ------------------------------------------------------------
// Check if notifications need rescheduling & cancel disabled ones
// ------------------------------------------------------------
export async function syncPrayerNotifications(settings) {
    const { prayerTimes, notifSettings, language } = settings;

    try {
        // Get all currently scheduled notifications
        const scheduled = await notifee.getTriggerNotifications();

        // Cancel notifications for prayers that are disabled
        for (const { notification } of scheduled) {
            const prayer = notification?.data?.prayer;
            if (prayer && notifSettings?.prayers?.[prayer]?.enabled === false) {
                await notifee.cancelTriggerNotification(notification.id);
                console.log(`🚫 Removed Notification for the prayer: ${prayer}`);
            }
        }

        // Check if remaining enabled prayers are up-to-date
        const areUpToDate = PRAYER_ORDER.every(prayerName => {
            // Skip prayers disabled by user
            if (notifSettings?.prayers?.[prayerName]?.enabled === false) return true;

            const timeString = prayerTimes[prayerName];

            // Skip prayers without a time
            if (!timeString) return true;

            // Find scheduled notification
            const notification = scheduled.find(
                n => n.notification.id === `prayer-${prayerName.toLowerCase()}`
            );

            // Not scheduled yet - needs rescheduling
            if (!notification) return false;

            // Extract Notification data
            const notifData = notification.notification.data;

            // Check if notification settings has changed
            const currentVolume = String(notifSettings?.volume ?? 1);
            if (notifData.volume !== currentVolume) return false;
            const currentVibration = String(notifSettings?.vibration ?? 'on');
            if (notifData.vibration !== currentVibration) return false;
            const currentSnooze = String(notifSettings?.snooze ?? 5);
            if (notifData.snooze !== currentSnooze) return false;
            const currentOffset = String(notifSettings?.offset ?? 0);
            if (notifData.offset !== currentOffset) return false;

            // Check if language has changed
            if (notifData.language !== language) return false;

            // Check if prayer time has changed
            const targetTime = getTriggerTime(timeString, prayerName);
            if (!targetTime) return false;

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
}

// ------------------------------------------------------------
// Schedule prayer notifications for all enabled prayers
// ------------------------------------------------------------
export async function schedulePrayerNotifications(settings) {
    const { prayerTimes, notifSettings, language, tr } = settings;

    if (!prayerTimes || !notifSettings) return;

    // Check if anything changed and if rescheduling is needed
    const isUpToDate = await syncPrayerNotifications(settings);
    if (isUpToDate) {
        console.log("✅ Prayer notifications are up-to-date - no scheduling needed");
        return;
    }

    try {
        // Cancel all existing notifications and create channels
        await cancelPrayerNotifications();
        await createNotificationChannels(notifSettings);

        // Check if alarm manager permission is granted
        const nf = await notifee.getNotificationSettings();
        const hasAlarm = nf.android.alarm === AndroidNotificationSetting.ENABLED;

        let scheduledCount = 0;

        // Schedule notifications for each enabled prayer
        for (const prayerName of PRAYER_ORDER) {
            // Skip disabled prayers
            if (notifSettings?.prayers?.[prayerName]?.enabled === false) continue;

            const timeString = prayerTimes[prayerName];

            // Skip prayers without a time
            if (!timeString) {
                console.log(`⚠️ No time available for ${prayerName}`);
                continue;
            }

            // Get the next valid trigger time (tomorrow if already passed)
            const triggerTime = getTriggerTime(timeString, prayerName);
            if (!triggerTime) continue;

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
                        volume: String(notifSettings?.volume ?? 1.0),
                        vibration: notifSettings?.vibration ?? 'on',
                        snooze: String(notifSettings?.snooze ?? 5),
                        offset: String(notifSettings?.offset ?? 0),
                    },
                    android: {
                        channelId: `prayer-notif-channel-vib-${notifSettings?.vibration ?? 'on'}`,
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
    }
}

// ------------------------------------------------------------
// Handle Notifee Notification event
// ------------------------------------------------------------
export async function handleNotificationEvent(type, notification, pressAction, source = 'unknown') {
    // Get notification data passed from schedulePrayerNotifications function
    const prayer = notification?.data?.prayer;
    const reminderTitle = notification?.data?.reminderTitle;
    const reminderBody = notification?.data?.reminderBody;
    const language = notification?.data?.language ?? 'en';
    const volume = Number(notification?.data?.volume ?? 1.0);
    const vibration = notification?.data?.vibration ?? 'on';
    const snooze = Number(notification?.data?.snooze ?? 5);
    const offset = Number(notification?.data?.offset ?? 0);

    // Check Alarm & Reminders permission
    const nf = await notifee.getNotificationSettings();
    const hasAlarm = nf.android.alarm === AndroidNotificationSetting.ENABLED;

    const prefix = source === 'background' ? '[Background]' : '[Foreground]';

    switch (type) {
        case EventType.DELIVERED:
            console.log(`✅ ${prefix} Notification delivered`);

            // For prayer notification
            if (notification?.data?.type === "prayer-notification") {
                await startSound('azan1.mp3', volume); // 29sec
            }
            // For prayer reminder notification
            if (notification?.data?.type === "prayer-reminder") {
                await startSound('beep1.mp3', volume); // 25sec
            }
            break;

        case EventType.ACTION_PRESS:
            switch (pressAction?.id) {
                case 'dismiss':
                    console.log(`🔘 ${prefix} Notification "Dismiss" pressed`);
                    await cancelDisplayedNotification(notification.id);
                    break;

                case 'snooze':
                    console.log(`⏰ ${prefix} Notification "Remind me later" pressed. Trigger in (${snooze}min)...`);
                    await cancelDisplayedNotification(notification.id);
                    try {
                        // Schedule timestamp reminder
                        await notifee.createTriggerNotification(
                            {
                                id: `prayer-reminder-${prayer}`,
                                title: reminderTitle,
                                body: reminderBody,
                                data: {
                                    type: "prayer-reminder",
                                    prayer: prayer,
                                    language: language,
                                    volume: String(volume),
                                    vibration: vibration,
                                    snooze: String(snooze),
                                    offset: String(offset),
                                },
                                android: {
                                    channelId: `prayer-remind-channel-vib-${vibration}`,
                                    showTimestamp: true,
                                    smallIcon: 'ic_stat_prayer', // Must exist in drawable android/app/src/main/res/drawable
                                    largeIcon: require('../../assets/images/past.png'), // Custom large icon
                                    color: AndroidColor.RED,
                                    pressAction: { id: 'default', launchActivity: 'default' },
                                    actions: [
                                        { title: 'OK', pressAction: { id: 'OK' } },
                                    ],
                                    autoCancel: false,
                                    ongoing: true,
                                },
                                ios: {
                                    categoryId: 'prayer-reminder-category',
                                    critical: false,
                                    interruptionLevel: 'active',
                                }
                            },
                            {
                                type: TriggerType.TIMESTAMP,
                                timestamp: Date.now() + snooze * 60 * 1000,
                                alarmManager: hasAlarm,
                            }
                        );
                    } catch (err) {
                        console.error(`❌ ${prefix} Failed to schedule snooze reminder:`, err);
                    }
                    break;

                case 'OK':
                    console.log(`✅ ${prefix} Notification Reminder "OK" pressed`);
                    await cancelDisplayedNotification(notification.id);
                    break;
            }
            break;

        case EventType.PRESS:
            console.log(`👆 ${prefix} Notification pressed`);
            await cancelDisplayedNotification(notification.id);
            break;

        case EventType.DISMISSED:
            console.log(`👆 ${prefix} Notification dismissed`);
            await cancelDisplayedNotification(notification.id);
            break;
    }
}