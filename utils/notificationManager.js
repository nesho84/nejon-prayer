import AsyncStorage from '@react-native-async-storage/async-storage';
import Sound from 'react-native-sound';
import notifee, {
    EventType,
    TriggerType,
    AndroidColor,
    AndroidNotificationSetting
} from '@notifee/react-native';

// ------------------------------------------------------------
// Default Configuration
// ------------------------------------------------------------
const DEFAULTS = {
    soundFile: 'sound1',
    soundVolume: 1.0, // 0.0 to 1.0
    // vibrationPattern: 'long', // (is handled in NotificationsContext.js)
    snoozeTimeout: 1, // minutes (5, 10, 15, 20, 30)
    autoStopDuration: 60000,
    SOUNDS: {
        sound1: 'azan1.mp3',
        sound2: 'alarm1.mp3',
    },
};

// ------------------------------------------------------------
// Internal state
// ------------------------------------------------------------
let currentSound = null;
let stopTimeout = null;

// ------------------------------------------------------------
// Load stored app settings
// ------------------------------------------------------------
async function loadSettings() {
    try {
        const jsonValue = await AsyncStorage.getItem('@app_settings_v1');
        if (!jsonValue) return {};
        const saved = JSON.parse(jsonValue);
        return saved?.notificationsConfig || {};
    } catch (e) {
        console.error('❌ Failed to load settings:', e);
        return {};
    }
}

// ------------------------------------------------------------
// Start Sound
// ------------------------------------------------------------
async function playSound(file, volume) {
    if (volume <= 0) return;

    try {
        await stopSound();

        const fileName = DEFAULTS.SOUNDS[file];
        if (!fileName) {
            console.error(`❌ Sound file not found: ${file}`);
            return;
        }

        currentSound = new Sound(fileName, Sound.MAIN_BUNDLE, (error) => {
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
    const settings = await loadSettings();
    const sound = options.sound ?? DEFAULTS.soundFile;
    const volume = settings.soundVolume ?? DEFAULTS.soundVolume;

    if (volume > 0) {
        await playSound(sound, volume);
    }

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
    const prefix = source === 'background' ? '[Background]' : '[Foreground]';

    // Load stored notification settings
    const stSettings = await loadSettings();
    const snoozeTimeout = stSettings.snoozeTimeout ?? DEFAULTS.snoozeTimeout; // in minutes

    // Check Alarm & Reminders permission
    const notifSettings = await notifee.getNotificationSettings();
    const hasAlarm = notifSettings.android.alarm === AndroidNotificationSetting.ENABLED;

    switch (type) {
        case EventType.DELIVERED:
            console.log("Notification data:", JSON.stringify(notification?.data, null, 2)); // @TODO: debugging....
            console.log(`✅ ${prefix} Notification delivered`);
            // For default notification
            if (notification?.data?.type === "prayer-notification") {
                await startAlert({ sound: 'sound1' });
            }
            // For reminder notification
            if (notification?.data?.type === "prayer-reminder") {
                await startAlert({ sound: 'sound2' });
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
                    console.log(`⏰ ${prefix} Notification "Remind Later" pressed`);
                    await notifee.cancelNotification(notification.id);

                    try {
                        // Schedule timestamp reminder
                        await notifee.createTriggerNotification(
                            {
                                id: `prayer-snooze-${notification?.data?.prayer}`,
                                title: notification?.data?.reminderTitle,
                                body: notification?.data?.reminderBody,
                                data: { type: "prayer-reminder" },
                                android: {
                                    channelId: 'prayer-reminders-channel', // (is created in NotificationsContext.js)
                                    showTimestamp: true,
                                    smallIcon: 'ic_stat_prayer',
                                    largeIcon: require('../assets/images/past.png'),
                                    color: AndroidColor.RED,
                                    pressAction: { id: 'default', launchActivity: 'default' },
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