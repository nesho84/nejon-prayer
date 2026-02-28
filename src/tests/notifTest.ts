import { SOUNDS } from "@/constants/sounds";
import { NotifSettings } from "@/types/notification.types";
import notifee, {
    AndroidColor,
    AndroidStyle,
    TimestampTrigger,
    TriggerType
} from "@notifee/react-native";

interface TestParams {
    options: {
        language: string;
        location?: any;
        fullAddress?: string | null;
        timeZone?: string | null;
        hasAlarm?: boolean;
    },
    notifSettings?: NotifSettings | null;
    seconds?: number;
}

// ------------------------------------------------------------
// Debug utility: schedule a test prayer notification
// ------------------------------------------------------------
export async function testPrayerNotification({ options, notifSettings, seconds = 10 }: TestParams) {
    try {
        // Default to 10 seconds later if no timestamp passed
        const triggerTime = Date.now() + seconds * 1000;

        // Schedule the notification
        await notifee.createTriggerNotification(
            {
                id: "prayer-test",
                title: "» Sabahu «",
                body: "Koha për namaz (06:49)",
                data: {
                    type: "prayer",
                    prayer: "Sabahu",
                    reminderTitle: "» Sabahu «",
                    reminderBody: "Kujtesë Lutjeje",
                    language: options?.language ?? 'en',
                    volume: String(notifSettings?.volume ?? 1.0),
                    vibration: notifSettings?.vibration ?? 'on',
                    snooze: String(notifSettings?.snooze ?? 5),
                    sound: SOUNDS.azan1_short, // Default sound for test
                },
                android: {
                    // (is created in notificationsService.js)
                    channelId: `prayer-vib-${notifSettings?.vibration ?? 'on'}`,
                    showTimestamp: true,
                    smallIcon: "ic_stat_prayer",
                    largeIcon: require("../../assets/images/moon-islam.png"),
                    color: AndroidColor.OLIVE,
                    pressAction: { id: "default", launchActivity: "default" },
                    actions: [
                        { title: "Në rregull", pressAction: { id: "dismiss" } },
                        { title: "Më kujto më vonë", pressAction: { id: "snooze" } },
                    ],
                    style: {
                        type: AndroidStyle.INBOX,
                        lines: ["Koha për namaz. (06:15)"],
                    },
                    autoCancel: false,
                    ongoing: true,
                },
                ios: {
                    categoryId: "prayer-category",
                    critical: false,
                    interruptionLevel: "active",
                },
            },
            {
                type: TriggerType.TIMESTAMP,
                timestamp: triggerTime,
                alarmManager: options.hasAlarm,
            }
        );

        const remainingSeconds = Math.max(0, Math.floor((triggerTime - Date.now()) / 1000) + 1);

        console.log(`🔔 Test notification scheduled to trigger in ${remainingSeconds}seconds...
            channelId: ${`prayer-notif-channel-vib-${notifSettings?.vibration}`}
            language: ${options?.language},
            alarm: ${options.hasAlarm},
            volume: ${notifSettings?.volume},
            vibration: ${notifSettings?.vibration},
            snooze: ${notifSettings?.snooze}
            `);

    } catch (err) {
        console.error("❌ Failed to schedule test notification:", err);
    }
}

// ------------------------------------------------------------
// Debug utility: schedule a test prayer-event notification (Imsak/Sunrise)
// ------------------------------------------------------------
export async function testPrayerEventNotification({ options, notifSettings, seconds = 10 }: TestParams) {
    try {
        const triggerTime = Date.now() + seconds * 1000;

        const eventName = 'Imsak';
        const body = `It is now time for (${eventName}) 04:52`;

        await notifee.createTriggerNotification(
            {
                id: "event-test",
                title: `» ${eventName} «`,
                body,
                data: {
                    type: "prayer-event",
                    event: eventName,
                    volume: String(notifSettings?.volume ?? 1.0),
                    vibration: notifSettings?.vibration ?? 'on',
                    snooze: String(notifSettings?.snooze ?? 5),
                    sound: SOUNDS.alarm2,
                },
                android: {
                    channelId: `general-vib-${notifSettings?.vibration ?? 'on'}`,
                    showTimestamp: true,
                    smallIcon: "ic_stat_prayer",
                    color: AndroidColor.BLUE,
                    pressAction: { id: "default", launchActivity: "default" },
                    actions: [
                        { title: "OK", pressAction: { id: "OK" } },
                    ],
                    style: {
                        type: AndroidStyle.INBOX,
                        lines: [body],
                    },
                    autoCancel: false,
                    ongoing: true,
                },
                ios: {
                    categoryId: "event-category",
                    critical: false,
                    interruptionLevel: "active",
                },
            },
            {
                type: TriggerType.TIMESTAMP,
                timestamp: triggerTime,
                alarmManager: options.hasAlarm,
            }
        );

        const remainingSeconds = Math.max(0, Math.floor((triggerTime - Date.now()) / 1000) + 1);
        console.log(`🔔 Test prayer-event notification scheduled in ${remainingSeconds}s`);
    } catch (err) {
        console.error("❌ Failed to schedule test prayer-event notification:", err);
    }
}

// ------------------------------------------------------------
// Debug utility: schedule a test prayer-reminder notification
// ------------------------------------------------------------
export async function testPrayerReminderNotification({ options, notifSettings = null, seconds = 10 }: TestParams) {
    try {
        const triggerTime = Date.now() + seconds * 1000;

        const title = "» Sabahu «";
        const body = "Kujtesë Lutjeje";

        await notifee.createTriggerNotification(
            {
                id: `reminder-test-${Date.now()}`,
                title,
                body,
                data: {
                    type: "prayer-reminder",
                    prayer: "Fajr",
                    language: options?.language ?? 'en',
                    volume: String(notifSettings?.volume ?? 1.0),
                    vibration: notifSettings?.vibration ?? 'on',
                    snooze: String(notifSettings?.snooze ?? 5),
                    offset: "0",
                    sound: SOUNDS.alarm1,
                },
                android: {
                    channelId: `general-vib-${notifSettings?.vibration ?? 'on'}`,
                    showTimestamp: true,
                    smallIcon: "ic_stat_prayer",
                    color: AndroidColor.RED,
                    pressAction: { id: "default", launchActivity: "default" },
                    actions: [
                        { title: "OK", pressAction: { id: "OK" } },
                    ],
                    style: {
                        type: AndroidStyle.INBOX,
                        lines: [body],
                    },
                    autoCancel: false,
                    ongoing: true,
                },
                ios: {
                    categoryId: "prayer-reminder-category",
                    critical: false,
                    interruptionLevel: "active",
                },
            },
            {
                type: TriggerType.TIMESTAMP,
                timestamp: triggerTime,
                alarmManager: options.hasAlarm,
            }
        );

        const remainingSeconds = Math.max(0, Math.floor((triggerTime - Date.now()) / 1000) + 1);
        console.log(`🔔 Test prayer-reminder notification scheduled in ${remainingSeconds}s`);
    } catch (err) {
        console.error("❌ Failed to schedule test prayer-reminder notification:", err);
    }
}

// ------------------------------------------------------------
// Debug utility: schedule a test Friday special notification
// ------------------------------------------------------------
export async function testFridayNotification({ options, notifSettings, seconds = 10 }: TestParams) {
    try {
        const triggerTime = Date.now() + seconds * 1000;

        const title = "Jumu'ah Reminder";
        const body = "Today is Jumu‘ah. Make time for prayer.";

        await notifee.createTriggerNotification(
            {
                id: `special-friday-test-${Date.now()}`,
                title,
                body,
                data: {
                    type: "special",
                    specialType: "Friday",
                    language: options?.language ?? 'en',
                    volume: String(notifSettings?.volume ?? 1.0),
                    vibration: notifSettings?.vibration ?? 'on',
                    snooze: String(notifSettings?.snooze ?? 5),
                    offset: "0",
                },
                android: {
                    channelId: `general-vib-${notifSettings?.vibration ?? 'on'}`,
                    showTimestamp: true,
                    smallIcon: "ic_stat_prayer",
                    color: AndroidColor.GREEN,
                    pressAction: { id: "default", launchActivity: "default" },
                    actions: [
                        { title: "OK", pressAction: { id: "OK" } },
                    ],
                    style: {
                        type: AndroidStyle.INBOX,
                        lines: [body],
                    },
                    autoCancel: false,
                    ongoing: true,
                },
                ios: {
                    categoryId: "special-category",
                    critical: false,
                    interruptionLevel: "active",
                },
            },
            {
                type: TriggerType.TIMESTAMP,
                timestamp: triggerTime,
                alarmManager: options.hasAlarm,
            }
        );

        const remainingSeconds = Math.max(0, Math.floor((triggerTime - Date.now()) / 1000) + 1);
        console.log(`🔔 Test Friday notification scheduled in ${remainingSeconds}s`);
    } catch (err) {
        console.error("❌ Failed to schedule test Friday notification:", err);
    }
}

// ------------------------------------------------------------
// Debug utility: schedule a test Daily Quote special notification
// ------------------------------------------------------------
export async function testDailyQuoteNotification({ options, notifSettings, seconds = 10 }: TestParams) {
    try {
        const triggerTime = Date.now() + seconds * 1000;

        const title = "Daily Reminder";
        const body = "Verily, in the remembrance of Allah do hearts find rest 💚 (Ar-Ra'd 13:28)";

        await notifee.createTriggerNotification(
            {
                id: "special-daily-quote-test",
                title,
                body,
                data: {
                    type: "special",
                    specialType: "DailyQuote",
                    quoteIndex: 0,
                    language: options?.language ?? 'en',
                    volume: String(notifSettings?.volume ?? 1.0),
                    vibration: notifSettings?.vibration ?? 'on',
                    snooze: String(notifSettings?.snooze ?? 5),
                    offset: "0",
                },
                android: {
                    channelId: `general-vib-${notifSettings?.vibration ?? 'on'}`,
                    showTimestamp: true,
                    smallIcon: "ic_stat_prayer",
                    color: AndroidColor.GREEN,
                    pressAction: { id: "default", launchActivity: "default" },
                    actions: [
                        { title: "OK", pressAction: { id: "OK" } },
                    ],
                    style: {
                        type: AndroidStyle.BIGTEXT,
                        text: body,
                    },
                    autoCancel: false,
                    ongoing: true,
                },
                ios: {
                    categoryId: "special-category",
                    critical: false,
                    interruptionLevel: "active",
                },
            },
            {
                type: TriggerType.TIMESTAMP,
                timestamp: triggerTime,
                alarmManager: options.hasAlarm,
            }
        );

        const remainingSeconds = Math.max(0, Math.floor((triggerTime - Date.now()) / 1000) + 1);
        console.log(`🔔 Test daily-quote notification scheduled in ${remainingSeconds}s`);
    } catch (err) {
        console.error("❌ Failed to schedule test daily-quote notification:", err);
    }
}

// ------------------------------------------------------------
// Debug utility: log all channels and scheduled notifications
// ------------------------------------------------------------
export async function debugChannelsAndScheduled() {
    try {
        const channels = await notifee.getChannels();
        const channelsObj = channels.map(c => ({
            id: c.id,
            name: c.name,
            vibration: c.vibration,
            vibrationPattern: c.vibrationPattern,
            importance: c.importance
        }));
        console.log('📡 All channels:', channelsObj);

        const scheduled = await notifee.getTriggerNotifications();
        const scheduledObj = scheduled.map(n => ({
            id: n.notification.id,
            channelId: n.notification.android?.channelId,
            data: n.notification.data,
            timestamp: (n.trigger as TimestampTrigger)?.timestamp
        }));
        console.log('⏰ Scheduled trigger notifications:', JSON.stringify(scheduledObj, null, 2));

        const settings = await notifee.getNotificationSettings();
        console.log('🔧 Notification settings:', settings);
    } catch (err) {
        console.error('❌ debugChannelsAndScheduled failed:', err);
    }
}

