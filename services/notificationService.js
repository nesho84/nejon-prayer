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
let currentSound = null;
let stopTimeout = null;

// ------------------------------------------------------------
// Start Sound
// ------------------------------------------------------------
async function startSound(file, volume, autoStopMs = 30000) {
    if (!file || volume <= 0) return;

    try {
        await stopSound();

        currentSound = new Sound(file, Sound.MAIN_BUNDLE, (error) => {
            if (error) {
                console.error('❌ Error loading sound:', error);
                return;
            }

            currentSound.setVolume(volume);
            currentSound.setNumberOfLoops(-1);
            currentSound.play();
            console.log('🔊 Sound started');
        });

        // Stop automatically after given duration
        if (stopTimeout) clearTimeout(stopTimeout);
        stopTimeout = setTimeout(() => stopSound(), autoStopMs);
    } catch (err) {
        console.error('❌ Error starting sound:', err);
    }
}

// ------------------------------------------------------------
// Stop Sound
// ------------------------------------------------------------
async function stopSound() {
    return new Promise((resolve) => {
        if (stopTimeout) {
            clearTimeout(stopTimeout);
            stopTimeout = null;
        }
        if (currentSound) {
            currentSound.stop(() => {
                currentSound.release();
                currentSound = null;
                console.log('🔇 Sound stopped');
                resolve();
            });
        } else {
            resolve();
        }
    });
}

// ------------------------------------------------------------
// Cancel all existing prayer notifications && remove channels
// ------------------------------------------------------------
export const cancelPrayerNotifications = async () => {
    try {
        // 1) Cancel scheduled notifications
        const scheduled = await notifee.getTriggerNotifications();
        for (const n of scheduled) {
            const type = n.notification.data?.type;
            if (type === 'prayer-notification' || type === 'prayer-reminder') {
                await notifee.cancelNotification(n.notification.id);
            }
        }

        // 2) Remove existing channels
        const allChannels = await notifee.getChannels();
        const toDelete = allChannels.map(c => c.id).filter(
            id => id && (id.startsWith('prayer-notifications-channel') || id.startsWith('prayer-reminders-channel'))
        );
        for (const id of toDelete) {
            try {
                await notifee.deleteChannel(id);
            } catch (err) {
                console.warn(`⚠️ Failed to delete channel ${id}:`, err);
            }
        }
        console.log('🔴 All existing notifications cancelled and channels removed');
    } catch (err) {
        console.error("❌ Failed to cancel notifications && remove prayer channels", err);
    }
};

// ------------------------------------------------------------
// Create notification channels once (Android only)
// ------------------------------------------------------------
export const createNotificationChannels = async (notificationsConfig) => {
    if (Platform.OS !== "android") return;

    // Get vibration pattern based on mode
    const getVibrationPattern = (patternName) => {
        const patterns = {
            off: [],
            short: Array(15).fill([500, 300]).flat(),   // 15s total, 10 cycles of 500ms on / 300ms off
            medium: Array(30).fill([1000, 300]).flat(), // 30s total, 15 cycles of 1s on / 300ms off
            long: Array(60).fill([1000, 300]).flat(),   // 60s total, 30 cycles of 1s on / 300ms off
        };
        return patterns[patternName] || patterns.medium;
    };

    try {
        const vibrationMode = notificationsConfig?.vibration ?? 'medium';
        const pattern = getVibrationPattern(vibrationMode);
        const hasVibration = pattern.length > 0;

        const channelConfig = {
            importance: AndroidImportance.HIGH,
            visibility: AndroidVisibility.PUBLIC,
            sound: undefined, // handled manually
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
        const notificationsChannelId = `prayer-notifications-channel-${vibrationMode}`;
        const remindersChannelId = `prayer-reminders-channel-${vibrationMode}`;

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
    } catch (err) {
        console.error("❌ Failed to create notification channels:", err);
    }
};

// ------------------------------------------------------------
// Handle Notifee Notification event (Public API)
// ------------------------------------------------------------
export async function handleNotificationEvent(type, notification, pressAction, source = 'unknown') {
    // Get notification data passed from SettingsContext
    const language = notification?.data?.language ?? 'en';
    const soundVolume = Number(notification?.data?.soundVolume ?? 1.0);
    const vibration = notification?.data?.vibration ?? 'medium';
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
                await startSound('azan1.mp3', soundVolume);
            }
            // For prayer reminder notification
            if (notification?.data?.type === "prayer-reminder") {
                await startSound('alarm1.mp3', soundVolume);
            }
            break;

        case EventType.ACTION_PRESS:
            await stopSound();
            switch (pressAction?.id) {
                case 'dismiss':
                    console.log(`✅ ${prefix} Notification "Dismiss" pressed`);
                    await notifee.cancelNotification(notification.id);
                    break;

                case 'snooze':
                    console.log(`⏰ ${prefix} Notification "Remind me later" pressed. Trigger in (${snoozeTimeout}min)...`);
                    await notifee.cancelNotification(notification.id);
                    try {
                        // Schedule timestamp reminder
                        await notifee.createTriggerNotification(
                            {
                                id: `prayer-reminder-${notification?.data?.prayer}`,
                                title: notification?.data?.reminderTitle,
                                body: notification?.data?.reminderBody,
                                data: {
                                    type: "prayer-reminder",
                                    soundVolume: soundVolume,
                                },
                                android: {
                                    channelId: `prayer-reminders-channel-${vibration}`,
                                    showTimestamp: true,
                                    smallIcon: 'ic_stat_prayer', // Must exist in drawable android/app/src/main/res/drawable
                                    largeIcon: require('../assets/images/past.png'), // Custom large icon
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
                    console.log(`✅ ${prefix} Reminder "OK" pressed`);
                    await notifee.cancelNotification(notification.id);
                    break;
            }
            break;

        case EventType.PRESS:
            console.log(`👆 ${prefix} Notification pressed`);
            await stopSound();
            await notifee.cancelNotification(notification.id);
            break;

        case EventType.DISMISSED:
            console.log(`👆 ${prefix} Notification dismissed`);
            await stopSound();
            await notifee.cancelNotification(notification.id);
            break;
    }
}