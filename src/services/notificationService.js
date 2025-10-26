import Sound from 'react-native-sound';
import notifee, {
    EventType,
    TriggerType,
    AndroidColor,
    AndroidNotificationSetting,
    AndroidImportance,
    AndroidVisibility
} from '@notifee/react-native';
import { Platform } from 'react-native';

// ------------------------------------------------------------
// Internal state
// ------------------------------------------------------------
const AZAN_SOUNDS = {
    short: 'azan-15sec.mp3', // 15sec (not used)
    medium: 'azan1.mp3', // 30sec
    long: 'azan-60sec.mp3', // 60sec (not used)
};

const ALARM_SOUNDS = {
    short: 'alarm-15sec.mp3', // 15sec (not used)
    medium: 'alarm1.mp3', // 30sec
    long: 'alarm-60sec.mp3', // 60sec (not used)
};

let currentSound = null;

// ------------------------------------------------------------
// Start Sound
// ------------------------------------------------------------
async function startSound(file, volume) {
    if (!file || volume <= 0) return;

    try {
        await stopSound();

        currentSound = new Sound(file, Sound.MAIN_BUNDLE, (err) => {
            if (err) {
                console.error('❌ [Sound] Failed to load:', err);
                return;
            }

            currentSound.setVolume(volume);
            currentSound.setNumberOfLoops(0); // play once

            const duration = currentSound.getDuration();

            console.log(`🔊 [Sound] Playing "${file} ${duration.toFixed(2)}sec" at volume ${volume}`);

            currentSound.play((success) => {
                if (success) {
                    // console.log('✅ [Sound] Finished playback');
                } else {
                    console.error('❌ [Sound] Playback failed');
                }
                stopSound();
            });
        });
    } catch (err) {
        console.error('❌ [Sound] Error starting:', err);
    }
}

// ------------------------------------------------------------
// Stop Sound
// ------------------------------------------------------------
async function stopSound() {
    return new Promise((resolve) => {
        if (currentSound) {
            currentSound.stop(() => {
                currentSound.release();
                currentSound = null;
                console.log('🔇 [Sound] Stopped & released');
                resolve();
            });
        } else {
            resolve();
        }
    });
}

// ------------------------------------------------------------
// Create notification channels once (Android only)
// ------------------------------------------------------------
export const createNotificationChannels = async (notificationsConfig) => {
    if (Platform.OS !== 'android') return;

    try {
        const vibration = notificationsConfig?.vibration ?? 'on';
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

        // Use vibrationMode in channel IDs
        const notificationsChannelId = `prayer-notif-channel-vib-${vibration}`;
        const remindersChannelId = `prayer-remind-channel-vib-${vibration}`;

        // Create prayer-notifications Channel
        await notifee.createChannel({
            id: notificationsChannelId,
            name: "Prayer Notifications",
            description: "Notifications for daily prayer times",
            ...channelConfig,
        });
        // Create prayer-reminders Channel
        await notifee.createChannel({
            id: remindersChannelId,
            name: 'Prayer Reminders',
            description: "Reminder for daily prayer times",
            ...channelConfig,
        });
    } catch (err) {
        console.error("❌ Failed to create notification channels:", err);
    }
};

// ------------------------------------------------------------
// Cancel All Scheduled Prayer Notifications
// ------------------------------------------------------------
export const cancelPrayerNotifications = async () => {
    try {
        // Cancel scheduled notifications
        const scheduled = await notifee.getTriggerNotifications();
        for (const n of scheduled) {
            const type = n.notification.data?.type;
            if (type === 'prayer-notification' || type === 'prayer-reminder') {
                await notifee.cancelNotification(n.notification.id);
            }
        }
        console.log('🔴 All existing notifications cancelled');
    } catch (err) {
        console.error("❌ Failed to cancel notifications", err);
    }
};

// ------------------------------------------------
// Clear everything: stop sound + remove notification
// ------------------------------------------------
async function clearAll(notificationId) {
    try {
        if (notificationId) {
            await notifee.cancelNotification(notificationId);
        }
        // Optional: clear all displayed notifications
        // await notifee.cancelDisplayedNotifications();
        await stopSound();
    } catch (err) {
        console.error('❌ [Cleanup] Failed to clear:', err);
    }
}

// ------------------------------------------------------------
// Handle Notifee Notification event (Public API)
// ------------------------------------------------------------
export async function handleNotificationEvent(type, notification, pressAction, source = 'unknown') {
    // Get notification data passed from SettingsContext
    const language = notification?.data?.language ?? 'en'; // not used currently
    const volume = Number(notification?.data?.volume ?? 1.0);
    const vibration = notification?.data?.vibration ?? 'on';
    const snoozeTimeout = Number(notification?.data?.snoozeTimeout ?? 5);

    // Check Alarm & Reminders permission
    const notifSettings = await notifee.getNotificationSettings();
    const hasAlarm = notifSettings.android.alarm === AndroidNotificationSetting.ENABLED;

    const prefix = source === 'background' ? '[Background]' : '[Foreground]';

    switch (type) {
        case EventType.DELIVERED:
            console.log(`✅ ${prefix} Notification delivered`);

            // For prayer notification
            if (notification?.data?.type === "prayer-notification") {
                const sound = AZAN_SOUNDS['medium'] ?? AZAN_SOUNDS.medium;
                await startSound(sound, volume);
            }
            // For prayer reminder notification
            if (notification?.data?.type === "prayer-reminder") {
                const sound = ALARM_SOUNDS['medium'] ?? ALARM_SOUNDS.medium;
                await startSound(sound, volume);
            }
            break;

        case EventType.ACTION_PRESS:
            switch (pressAction?.id) {
                case 'dismiss':
                    console.log(`🛑 ${prefix} Notification "Dismiss" pressed`);
                    await clearAll(notification.id);
                    break;

                case 'snooze':
                    console.log(`⏰ ${prefix} Notification "Remind me later" pressed. Trigger in (${snoozeTimeout}min)...`);
                    await clearAll(notification.id);
                    try {
                        // Schedule timestamp reminder
                        await notifee.createTriggerNotification(
                            {
                                id: `prayer-reminder-${notification?.data?.prayer}`,
                                title: notification?.data?.reminderTitle,
                                body: notification?.data?.reminderBody,
                                data: {
                                    type: "prayer-reminder",
                                    volume: volume,
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
                                timestamp: Date.now() + snoozeTimeout * 60 * 1000,
                                alarmManager: hasAlarm,
                            }
                        );
                    } catch (err) {
                        console.error(`❌ ${prefix} Failed to schedule snooze reminder:`, err);
                    }
                    break;

                case 'OK':
                    console.log(`✅ ${prefix} Notification Reminder "OK" pressed`);
                    await clearAll(notification.id);
                    break;
            }
            break;

        case EventType.PRESS:
            console.log(`👆 ${prefix} Notification pressed`);
            await clearAll(notification.id);
            break;

        case EventType.DISMISSED:
            console.log(`👆 ${prefix} Notification dismissed`);
            await clearAll(notification.id);
            break;
    }
}

// ------------------------------------------------------------
// Background handler for Notifee
// This will fire when:
// The device is locked.
// The application is running & is in not in view (minimized).
// The application is killed/quit.
// Notification action is pressed
// ------------------------------------------------------------
// To register your handler, the onBackgroundEvent method should be registered in your project(root)
// (e.g. the index.js file):
// ------------------------------------------------------------
notifee.onBackgroundEvent(async ({ type, detail }) => {
    const { notification, pressAction } = detail;

    // Ignore if no notification
    if (!notification) return;

    await handleNotificationEvent(type, notification, pressAction, 'background');
});