import Sound from 'react-native-sound';
import notifee, {
    EventType,
    TriggerType,
    AndroidColor,
    AndroidNotificationSetting
} from '@notifee/react-native';

// ------------------------------------------------------------
// Internal state
// ------------------------------------------------------------
let currentSound = null;
let stopTimeout = null;

// ------------------------------------------------------------
// Default Configuration
// ------------------------------------------------------------
const DEFAULTS = {
    soundFile: 'azan1.mp3', // android/app/src/main/res/raw/azan1.mp3
    soundVolume: 1.0, // off or 0.0 to 1.0
    vibration: 'medium', // short, medium, long (is handled in NotificationsContext.js)
    snoozeTimeout: 5, // minutes (1, 5, 10, 15, 20, 30)
    autoStopDuration: 60000, // 60 seconds/1 minute
};

// ------------------------------------------------------------
// Start Sound
// ------------------------------------------------------------
async function playSound(file, volume) {
    if (volume <= 0) return;

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
    } catch (err) {
        console.error('❌ Error starting sound:', err);
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
                console.log('🔇 Sound stopped');
                resolve();
            });
        } else {
            resolve();
        }
    });
}

// ------------------------------------------------------------
// Start Alert (Public API)
// ------------------------------------------------------------
export async function startAlert(options = {}) {
    const sound = options.soundFile ?? DEFAULTS.soundFile;
    const volume = options.soundVolume ?? DEFAULTS.soundVolume;

    await playSound(sound, volume);

    if (stopTimeout) clearTimeout(stopTimeout);
    stopTimeout = setTimeout(() => stopAlert(), DEFAULTS.autoStopDuration);
}

// ------------------------------------------------------------
// Stop Alert (Public API)
// ------------------------------------------------------------
export async function stopAlert() {
    if (stopTimeout) {
        clearTimeout(stopTimeout);
        stopTimeout = null;
    }
    await stopSound();
}

// ------------------------------------------------------------
// Handle Notifee Notification event (Public API)
// ------------------------------------------------------------
export async function handleNotificationEvent(type, notification, pressAction, source = 'unknown') {
    // Get notification data passed from SettingsContext
    const language = notification?.data?.language ?? 'en';
    const soundVolume = Number(notification?.data?.soundVolume ?? DEFAULTS.soundVolume);
    const vibration = notification?.data?.vibration ?? DEFAULTS.vibration;
    const snoozeTimeout = Number(notification?.data?.snoozeTimeout ?? DEFAULTS.snoozeTimeout);

    // Check Alarm & Reminders permission
    const notifSettings = await notifee.getNotificationSettings();
    const hasAlarm = notifSettings.android.alarm === AndroidNotificationSetting.ENABLED;

    const prefix = source === 'background' ? '[Background]' : '[Foreground]';

    switch (type) {
        case EventType.DELIVERED:
            console.log(`✅ ${prefix} Notification delivered`);

            // For default notification
            if (notification?.data?.type === "prayer-notification") {
                await startAlert({ soundFile: 'azan1.mp3', soundVolume });
            }
            // For reminder notification
            if (notification?.data?.type === "prayer-reminder") {
                await startAlert({ soundFile: 'alarm1.mp3', soundVolume });
            }
            break;

        case EventType.ACTION_PRESS:
            await stopAlert();
            switch (pressAction?.id) {
                case 'mark-prayed':
                    console.log(`✅ ${prefix} Notification "Prayed" pressed`);
                    await notifee.cancelNotification(notification.id);
                    break;

                case 'snooze-prayer':
                    console.log(`⏰ ${prefix} Notification "Remind Later" pressed (${snoozeTimeout}min)`);
                    await notifee.cancelNotification(notification.id);

                    try {
                        // Schedule timestamp reminder
                        await notifee.createTriggerNotification(
                            {
                                id: `prayer-snooze-${notification?.data?.prayer}`,
                                title: notification?.data?.reminderTitle,
                                body: notification?.data?.reminderBody,
                                data: {
                                    type: "prayer-reminder",
                                    soundVolume: soundVolume,
                                },
                                android: {
                                    // (is created in NotificationsContext.js)
                                    channelId: `prayer-reminders-channel-${vibration ?? DEFAULTS.vibration}`,
                                    showTimestamp: true,
                                    smallIcon: 'ic_stat_prayer',
                                    largeIcon: require('../assets/images/past.png'),
                                    color: AndroidColor.RED,
                                    pressAction: { id: 'default', launchActivity: 'default' },
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
            }
            break;

        case EventType.PRESS:
            console.log(`👆 ${prefix} Notification pressed`);
            await stopAlert();
            await notifee.cancelNotification(notification.id);
            break;

        case EventType.DISMISSED:
            console.log(`👆 ${prefix} Notification dismissed`);
            await stopAlert();
            await notifee.cancelNotification(notification.id);
            break;
    }
}