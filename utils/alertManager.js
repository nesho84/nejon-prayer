import Sound from 'react-native-sound';
import { Vibration, Platform } from 'react-native';
import notifee, { AndroidImportance, EventType, TriggerType, AndroidColor, AndroidNotificationSetting } from '@notifee/react-native';

// ------------------------------------------------------------
// Configuration
// ------------------------------------------------------------
const CONFIG = {
    soundEnabled: true,
    soundFile: 'azan1',
    soundVolume: 1.0,
    vibrationPattern: 'medium',
    autoStopDuration: 60000,
    vibrationPatterns: {
        off: null,
        short: [200],
        medium: [500, 300, 500],
        long: [500, 300, 500, 300],
    },
    androidNotification: {
        id: 'prayer-alert',
        title: 'Prayer Alert',
        channelId: 'prayer-alerts',
        color: AndroidColor.RED,
        importance: AndroidImportance.HIGH,
        smallIcon: 'ic_stat_prayer',
    },
};

// ------------------------------------------------------------
// Static Sounds
// ------------------------------------------------------------
const SOUNDS = {
    azan1: 'azan1.mp3',
    azan2: 'azan2.mp3',
};

// ------------------------------------------------------------
// Internal state
// ------------------------------------------------------------
let currentSound = null;
let vibrationInterval = null;
let stopTimeout = null;

// ------------------------------------------------------------
// Optional Android foreground service notification
// ------------------------------------------------------------
async function showForegroundNotification() {
    if (Platform.OS !== 'android') return;

    // try {
    //     // Ensure the channel exists
    //     await notifee.createChannel({
    //         id: CONFIG.androidNotification.channelId,
    //         name: 'Prayer Alerts',
    //         importance: CONFIG.androidNotification.importance,
    //     });

    //     // Show ongoing foreground notification
    //     await TrackPlayer.updateOptions({
    //         stopWithApp: false,
    //         capabilities: [Capability.Play, Capability.Stop],
    //         notificationCapabilities: [Capability.Play, Capability.Stop],
    //         compactCapabilities: [Capability.Play, Capability.Stop],
    //         progressUpdateEventInterval: 1,
    //     });

    //     await notifee.displayNotification({
    //         id: CONFIG.androidNotification.id,
    //         title: CONFIG.androidNotification.title,
    //         body: 'Prayer alert is playing',
    //         android: {
    //             channelId: CONFIG.androidNotification.channelId,
    //             ongoing: true,
    //             color: CONFIG.androidNotification.color,
    //             smallIcon: CONFIG.androidNotification.smallIcon,
    //         },
    //     });
    // } catch (err) {
    //     console.error('❌ Failed to show Android foreground notification:', err);
    // }
}

// ------------------------------------------------------------
// Start Sound
// ------------------------------------------------------------
async function playSound(file, volume) {
    try {
        await stopSound();

        const fileName = SOUNDS[file];
        if (!fileName) {
            console.error(`❌ Sound not found: ${file}`);
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
// Start Vibration
// ------------------------------------------------------------
function startVibration(pattern) {
    const selectedPattern = CONFIG.vibrationPatterns[pattern];
    if (!selectedPattern) return;

    stopVibration();

    Vibration.vibrate(selectedPattern);
    vibrationInterval = setInterval(() => Vibration.vibrate(selectedPattern), 1000);
    console.log(`📳 Vibration started`);
}

// ------------------------------------------------------------
// Stop Vibration
// ------------------------------------------------------------
function stopVibration() {
    if (vibrationInterval) {
        clearInterval(vibrationInterval);
        vibrationInterval = null;
    }
    Vibration.cancel();
    console.log('📳 Vibration stopped');
}

// ------------------------------------------------------------
// Start Alert (Public API)
// ------------------------------------------------------------
export async function startAlert(options = {}) {
    const {
        soundEnabled = CONFIG.soundEnabled,
        sound = CONFIG.soundFile,
        volume = CONFIG.soundVolume,
        vibration = CONFIG.vibrationPattern,
    } = options;

    if (soundEnabled) {
        try {
            await playSound(sound, volume);
        } catch (err) {
            console.error('❌ Failed to start alert:', err);
        }
    }
    startVibration(vibration);

    if (stopTimeout) clearTimeout(stopTimeout);
    stopTimeout = setTimeout(() => stopAlert(), CONFIG.autoStopDuration);
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
    stopVibration();
}

// ------------------------------------------------------------
// Handle Notifee Notification event (Public API)
// ------------------------------------------------------------
export async function handleNotificationEvent(type, notification, pressAction, source = 'unknown') {
    const prefix = source === 'background' ? '[Background]' : '[Foreground]';

    // Check Alarm & Reminders permission
    const settings = await notifee.getNotificationSettings();
    const hasAlarm = settings.android.alarm === AndroidNotificationSetting.ENABLED;

    switch (type) {
        case EventType.DELIVERED:
            console.log(`✅ ${prefix} notification delivered`);
            // For default notification
            if (notification?.data?.type === "prayer") { // @TODO: these data should come from appSettings from AsyncStorage
                await startAlert({
                    soundEnabled: true,
                    sound: 'azan1',
                    volume: 1.0,
                    vibration: 'medium',
                });
            }
            // For reminder notification
            // if (notification?.data?.type === "prayer-reminder") {
            //   await startAlert({...});
            // }
            break;
        case EventType.ACTION_PRESS:
            await stopAlert();

            switch (pressAction?.id) {
                case 'mark-prayed':
                    console.log(`✅ ${prefix} Marked "${notification?.data?.prayer}" as prayed`);
                    await notifee.cancelNotification(notification.id);
                    break;
                case 'snooze-prayer':
                    console.log(`⏰ ${prefix} Snoozed "${notification?.data?.prayer}"`);
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
                                    channelId: 'prayer-reminders',
                                    showTimestamp: true,
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
                    } catch (err) {
                        console.error(`❌ ${prefix} Failed to schedule snooze reminder:`, err);
                    }
                    break;
            }
            break;
        case EventType.PRESS:
            console.log(`👆 ${prefix} Notification pressed for ${notification?.data?.prayer || 'N/A'}`);
            await stopAlert();
            await notifee.cancelNotification(notification.id);
            break;
        case EventType.DISMISSED:
            console.log(`👆 ${prefix} Notification dismissed for ${notification?.data?.prayer || 'N/A'}`);
            await stopAlert();
            await notifee.cancelNotification(notification.id);
            break;
    }
}