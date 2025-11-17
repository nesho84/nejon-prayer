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

// ------------------------------------------------------------
// Defines behavior for each notification type
// - prayer: Daily prayer notifications (Fajr, Dhuhr, Asr, Maghrib, Isha)
// - event: Time events (Imsak, Sunrise)
// - reminder: Snooze reminders (triggered by user action)
// ------------------------------------------------------------
const NOTIFICATION_CONFIG = {
    prayer: {
        type: 'prayer-notification',
        sound: 'azan1.mp3', // 29sec
        channel: 'prayer',
        color: AndroidColor.OLIVE,
        categoryId: 'prayer-category',
        notifBody: 'labels.prayerNotifBody', // "Time for Prayer"
    },
    reminder: {
        type: 'prayer-reminder',
        sound: 'beep1.mp3', // 25sec
        channel: 'general',
        color: AndroidColor.RED,
        categoryId: 'prayer-reminder-category',
        notifBody: 'labels.prayerRemindBody', // "Prayer Reminder"
    },
    event: {
        type: 'event-notification',
        sound: 'beep1.mp3', // 25sec
        channel: 'general',
        color: AndroidColor.BLUE,
        categoryId: 'event-category',
        notifBody: 'labels.eventNotifBody', // "???"
    },
};

// ------------------------------------------------------------
// List of all scheduled notifications (order matters for scheduling)
// To add a new notification, just add one line: { name: 'Name', type: 'prayer' | 'event' }
// ------------------------------------------------------------
const NOTIFICATIONS = [
    { name: 'Fajr', type: 'prayer' },
    { name: 'Dhuhr', type: 'prayer' },
    { name: 'Asr', type: 'prayer' },
    { name: 'Maghrib', type: 'prayer' },
    { name: 'Isha', type: 'prayer' },
    { name: 'Imsak', type: 'event' },
    { name: 'Sunrise', type: 'event' },
];

// ------------------------------------------------------------
// Generate notification ID based on type and name
// ------------------------------------------------------------
const getNotificationId = (name) => {
    const item = NOTIFICATIONS.find(n => n.name === name);
    const type = item ? item.type : null;
    return type ? `${type}-${name.toLowerCase()}` : null;
};

// ------------------------------------------------------------
// Get notification action buttons based on type
// ------------------------------------------------------------
const getNotificationActions = (type, tr) => {
    if (type === 'prayer') {
        return [
            { title: tr("actions.dismiss"), pressAction: { id: 'dismiss' } },
            { title: tr("actions.snooze"), pressAction: { id: 'snooze' } },
        ];
    }
    return [
        { title: 'OK', pressAction: { id: 'OK' } }
    ];
};

// ------------------------------------------------------------
// Create notification channels once (Android only)
// ------------------------------------------------------------
const createNotificationChannels = async (notifSettings) => {
    if (Platform.OS !== 'android') return;

    try {
        const vibration = notifSettings?.vibration ?? 'on';
        const isEnabled = vibration === 'on';
        // Vibration pattern: 30 seconds total, 15 cycles of 1s on / 300ms off
        const pattern = Array(30).fill([1000, 300]).flat();

        const channelConfig = {
            importance: AndroidImportance.HIGH,
            visibility: AndroidVisibility.PUBLIC,
            sound: undefined, // Sound is handled manually in the app
            vibration: isEnabled,
            vibrationPattern: isEnabled ? pattern : undefined,
            lights: true,
            lightColor: AndroidColor.WHITE,
            badge: true,
            autoCancel: false, // Notifications must be manually dismissed
            ongoing: true, // Prevents swiping away
            bypassDnd: true, // Show even in Do Not Disturb mode
        };

        // Channel 1: Prayer notifications (5 daily prayers)
        await notifee.createChannel({
            id: `prayer-vib-${vibration}`,
            name: "Prayer Notifications Channel",
            description: "Notifications for daily prayer times",
            ...channelConfig,
        });
        // Channel 2: General notifications (reminders, Imsak, Sunrise, etc.)
        await notifee.createChannel({
            id: `general-vib-${vibration}`,
            name: 'General Notifications Channel',
            description: "Reminders and event notifications",
            ...channelConfig,
        });
    } catch (err) {
        console.error("❌ Failed to create notification channels:", err);
    }
};

// ------------------------------------------------------------
// Cancel all scheduled notifications
// ------------------------------------------------------------
const cancelPrayerNotifications = async () => {
    try {
        const scheduled = await notifee.getTriggerNotifications();
        const validTypes = ['prayer-notification', 'prayer-reminder', 'event-notification'];

        for (const n of scheduled) {
            const type = n.notification.data?.type;
            if (validTypes.includes(type)) {
                await notifee.cancelTriggerNotification(n.notification.id);
            }
        }
        console.log('🔴 All existing notifications cancelled');
    } catch (err) {
        console.error("❌ Failed to cancel notifications", err);
    }
};

// ------------------------------------------------
// Cancel displayed notification and stop sound
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
function getTriggerTime(timeStringRaw, prayerName, offsetMinutes = 0) {
    // Normalize: trim whitespace and replace non-breaking spaces
    const timeString = String(timeStringRaw).replace(/\u00A0/g, " ").trim();

    // Validate format: must be HH:mm (e.g., "13:45" or "5:30")
    const match = timeString.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) {
        console.warn(`⚠️ Invalid time format for ${prayerName}:`, timeStringRaw);
        return null;
    }

    // Extract hour and minute
    const hour = Number(match[1]);
    const minute = Number(match[2]);

    // Create trigger time for today
    const triggerTime = new Date();
    triggerTime.setHours(hour, minute, 0, 0);

    // Apply offset (e.g., -15 = 15 minutes before, +10 = 10 minutes after)
    if (offsetMinutes !== 0) {
        triggerTime.setMinutes(triggerTime.getMinutes() + offsetMinutes);
    }

    // If time has already passed today, schedule for tomorrow
    const now = new Date();
    if (triggerTime <= now) {
        triggerTime.setDate(triggerTime.getDate() + 1);
    }

    return triggerTime;
}

// ------------------------------------------------------------
// Cancels notifications for disabled prayers/events
// ------------------------------------------------------------
async function cancelDisabledNotifications(settings) {
    const { notifSettings } = settings;

    try {
        // Get all currently scheduled trigger notifications
        const scheduled = await notifee.getTriggerNotifications();

        for (const { notification } of scheduled) {
            const prayer = notification?.data?.prayer;
            if (prayer && notifSettings?.prayers?.[prayer]?.enabled === false) {
                await notifee.cancelTriggerNotification(notification.id);
                console.log(`🚫 Canceled Notification for: ${prayer}`);
            }
        }
    } catch (err) {
        console.error('Error during notification cancel', err);
    }
}

// ------------------------------------------------------------
// Check if scheduled notifications are up-to-date
// ------------------------------------------------------------
async function syncPrayerNotifications(settings) {
    const { prayerTimes, notifSettings, language } = settings;

    try {
        // Get all currently scheduled trigger notifications
        const scheduled = await notifee.getTriggerNotifications();

        // Check if remaining enabled notifications are up-to-date
        const areUpToDate = NOTIFICATIONS.every(({ name }) => {
            // Skip disabled notifications (they're up-to-date by definition)
            if (notifSettings?.prayers?.[name]?.enabled === false) return true;

            const timeString = prayerTimes[name];

            // Skip notifications without a time (no prayer time available)
            if (!timeString) return true;

            // Find scheduled notification
            const notifId = getNotificationId(name);
            const notification = scheduled.find(n => n.notification.id === notifId);

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
            const currentOffset = String(notifSettings?.prayers?.[name]?.offset ?? 0);
            if (notifData.offset !== currentOffset) return false;

            // Check if language has changed
            if (notifData.language !== language) return false;

            // Check if prayer time has changed (with offset applied)
            const offsetMinutes = notifSettings?.prayers?.[name]?.offset ?? 0;
            const targetTime = getTriggerTime(timeString, name, offsetMinutes);
            if (!targetTime) return false;

            // Compare scheduled timestamp with expected timestamp
            if (notification.trigger.timestamp !== targetTime.getTime()) {
                return false;
            }

            // All checks passed - this notification is up-to-date
            return true;
        });

        return areUpToDate;
    } catch (err) {
        console.error('Error during notification reschedule check:', err);
        return false; // Force reschedule on error
    }
}

// ------------------------------------------------------------
// Schedule prayer notifications for all enabled prayers
// ------------------------------------------------------------
export async function schedulePrayerNotifications(settings) {
    const { prayerTimes, notifSettings, language, tr } = settings;

    // Guard: Ensure required data is available
    if (!prayerTimes || !notifSettings) return;

    // Cancel notifications for disabled prayers/events
    await cancelDisabledNotifications(settings);

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

        // Check if exact alarm permission is granted (Android 12+)
        const nf = await notifee.getNotificationSettings();
        const hasAlarm = nf.android.alarm === AndroidNotificationSetting.ENABLED;

        let scheduledCount = 0;

        // Schedule notifications for each enabled prayer/event
        for (const { name, type } of NOTIFICATIONS) {
            // Skip disabled notifications
            if (notifSettings?.prayers?.[name]?.enabled === false) continue;

            const timeString = prayerTimes[name];

            // Skip prayers without a time
            if (!timeString) {
                console.log(`⚠️ No time available for ${name}`);
                continue;
            }

            // Calculate trigger time (with offset applied)
            const offsetMinutes = notifSettings?.prayers?.[name]?.offset ?? 0;
            const triggerTime = getTriggerTime(timeString, name, offsetMinutes);
            if (!triggerTime) continue;

            // Get configuration for this notification type
            const nConfig = NOTIFICATION_CONFIG[type];
            const notifId = getNotificationId(name);
            const notifBody = `${tr(nConfig.notifBody)} (${timeString})`;
            const channelId = `${nConfig.channel}-vib-${notifSettings?.vibration}`;
            const actions = getNotificationActions(type, tr);

            // Create the trigger notification
            await notifee.createTriggerNotification(
                // Notification configuration
                {
                    id: notifId,
                    title: `» ${tr(`prayers.${name}`)} «`,
                    body: notifBody,
                    data: {
                        type: nConfig.type,
                        prayer: name,
                        reminderTitle: `» ${tr(`prayers.${name}`)} «`,
                        reminderBody: type === 'prayer' ? tr("labels.prayerRemindBody") : "",
                        language: language,
                        volume: String(notifSettings?.volume ?? 1.0),
                        vibration: notifSettings?.vibration,
                        snooze: String(notifSettings?.snooze ?? 5),
                        offset: String(offsetMinutes),
                    },
                    android: {
                        channelId: channelId,
                        showTimestamp: true,
                        smallIcon: 'ic_stat_prayer', // Must exist in android/app/src/main/res/drawable
                        largeIcon: require('../../assets/images/moon-islam.png'), // Custom large icon
                        color: nConfig.color,
                        pressAction: { id: 'default', launchActivity: 'default' },
                        actions: actions,
                        style: {
                            type: AndroidStyle.INBOX,
                            lines: [notifBody],
                        },
                        autoCancel: false,
                        ongoing: true,
                    },
                    ios: {
                        categoryId: nConfig.categoryId,
                        critical: false,
                        interruptionLevel: 'active',
                    }
                },
                // Trigger configuration
                {
                    type: TriggerType.TIMESTAMP,
                    timestamp: triggerTime.getTime(),
                    alarmManager: hasAlarm, // Use exact alarms if available
                    repeatFrequency: RepeatFrequency.DAILY, // Repeat every day
                }
            );

            scheduledCount++;

            // Log scheduled time with offset info
            const formattedDate = triggerTime.toLocaleDateString('en-GB') + ', ' +
                triggerTime.toLocaleTimeString('en-GB', { hour12: false });
            const offsetInfo = offsetMinutes !== 0 ? ` (offset: ${offsetMinutes > 0 ? '+' : ''}${offsetMinutes} min)` : '';
            const typeEmoji = type === 'event' ? '📅' : '⏰';

            console.log(`${typeEmoji} Scheduled ${name} at ${formattedDate}${offsetInfo}`);
        }

        console.log(`🔔 Successfully scheduled ${scheduledCount} notification(s)`);
    } catch (err) {
        console.error("❌ Failed to schedule notifications:", err);
    }
}

// ------------------------------------------------------------
// Handle Notifee Notification events
// ------------------------------------------------------------
export async function handleNotificationEvent(type, notification, pressAction, source = 'unknown') {
    // Extract notification data
    const prayer = notification?.data?.prayer;
    const reminderTitle = notification?.data?.reminderTitle;
    const reminderBody = notification?.data?.reminderBody;
    const language = notification?.data?.language ?? 'en';
    const volume = Number(notification?.data?.volume ?? 1.0);
    const vibration = notification?.data?.vibration ?? 'on';
    const snooze = Number(notification?.data?.snooze ?? 5);
    const offset = Number(notification?.data?.offset ?? 0);

    // Check if exact alarms are available
    const nf = await notifee.getNotificationSettings();
    const hasAlarm = nf.android.alarm === AndroidNotificationSetting.ENABLED;

    const prefix = source === 'background' ? '[Background]' : '[Foreground]';

    switch (type) {
        case EventType.DELIVERED:
            // Notification was delivered and shown to user
            console.log(`✅ ${prefix} Notification delivered`);

            const notifType = notification?.data?.type;

            // For prayer notification
            if (notifType === "prayer-notification") {
                await startSound('azan1.mp3', volume); // 29sec - Azan for prayers
            }
            // For prayer reminder/event notification
            else if (notifType === "event-notification" || notifType === "prayer-reminder") {
                await startSound('beep1.mp3', volume); // 25sec - Beep for events/reminders
            }
            break;

        case EventType.ACTION_PRESS:
            // User pressed an action button
            switch (pressAction?.id) {
                case 'dismiss':
                    // Dismiss button pressed (prayers only)
                    console.log(`🔘 ${prefix} Notification "Dismiss" pressed`);
                    await cancelDisplayedNotification(notification.id);
                    break;

                case 'snooze':
                    // Snooze button pressed (prayers only)
                    console.log(`⏰ ${prefix} Notification "Remind me later" pressed. Trigger in (${snooze}min)...`);
                    await cancelDisplayedNotification(notification.id);

                    try {
                        const reminderConfig = NOTIFICATION_CONFIG['reminder'];
                        const channelId = `${reminderConfig.channel}-vib-${vibration}`;

                        // Schedule a reminder notification after snooze duration
                        await notifee.createTriggerNotification(
                            {
                                id: `prayer-reminder-${prayer}-${Date.now()}`,
                                title: reminderTitle,
                                body: reminderBody,
                                data: {
                                    type: reminderConfig.type,
                                    prayer: prayer,
                                    language: language,
                                    volume: String(volume),
                                    vibration: vibration,
                                    snooze: String(snooze),
                                    offset: String(offset),
                                },
                                android: {
                                    channelId: channelId,
                                    showTimestamp: true,
                                    smallIcon: 'ic_stat_prayer', // Must exist in drawable android/app/src/main/res/drawable
                                    largeIcon: require('../../assets/images/past.png'), // Custom large icon
                                    color: reminderConfig.color,
                                    pressAction: { id: 'default', launchActivity: 'default' },
                                    actions: [
                                        { title: 'OK', pressAction: { id: 'OK' } },
                                    ],
                                    autoCancel: false,
                                    ongoing: true,
                                },
                                ios: {
                                    categoryId: reminderConfig.categoryId,
                                    critical: false,
                                    interruptionLevel: 'active',
                                }
                            },
                            {
                                type: TriggerType.TIMESTAMP,
                                timestamp: Date.now() + snooze * 60 * 1000, // Trigger after snooze minutes
                                alarmManager: hasAlarm,
                            }
                        );
                    } catch (err) {
                        console.error(`❌ ${prefix} Failed to schedule snooze reminder:`, err);
                    }
                    break;

                case 'OK':
                    // OK button pressed (events and reminders)
                    console.log(`✅ ${prefix} Notification Reminder "OK" pressed`);
                    await cancelDisplayedNotification(notification.id);
                    break;
            }
            break;

        case EventType.PRESS:
            // User tapped the notification body
            console.log(`👆 ${prefix} Notification pressed`);
            await cancelDisplayedNotification(notification.id);
            break;

        case EventType.DISMISSED:
            // User swiped away the notification
            console.log(`👆 ${prefix} Notification dismissed`);
            await cancelDisplayedNotification(notification.id);
            break;
    }
}