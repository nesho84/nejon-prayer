import { SOUNDS } from "@/constants/sounds";
import { NotifSettings } from "@/types/notification.types";
import { toDateKey } from "@/utils/date";
import notifee, {
    AndroidCategory,
    AndroidColor,
    AndroidStyle,
    TimestampTrigger,
    TriggerType
} from "react-native-notify-kit";

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
                    volume: String(notifSettings?.volume ?? 1.0),
                    sound: SOUNDS.azan1_short, // Default sound for test
                    vibration: notifSettings?.vibration ?? 'short',
                    snooze: String(notifSettings?.snooze ?? 5),
                    prayerName: 'Fajr',
                    prayerDate: toDateKey(new Date(triggerTime)),
                    reminderTitle: "» Sabahu «",
                    reminderBody: "Kujtesë Lutjeje",
                },
                android: {
                    // (Channel is created in notificationsService.ts)
                    channelId: `nejonprayer-vib-${notifSettings?.vibration ?? 'short'}`,
                    category: AndroidCategory.ALARM,
                    smallIcon: "ic_stat_prayer",
                    largeIcon: require("../../assets/images/moon-islam.png"),
                    color: AndroidColor.OLIVE,
                    style: { type: AndroidStyle.INBOX, lines: ["Koha për namaz. (06:15)"] },
                    actions: [
                        { title: "✓ Falur", pressAction: { id: 'done' } },
                        { title: "Anulo", pressAction: { id: "dismiss" } },
                        { title: "Më kujto më vonë", pressAction: { id: "snooze" } },
                    ],
                    pressAction: { id: "default", launchActivity: "default" },
                    lightUpScreen: true,
                    showTimestamp: true,
                    autoCancel: false,
                    ongoing: true,
                },
                ios: {
                    categoryId: "prayer-category",
                    interruptionLevel: "active",
                },
            },
            {
                type: TriggerType.TIMESTAMP,
                timestamp: triggerTime,
                alarmManager: options.hasAlarm,
                // repeatFrequency: RepeatFrequency.DAILY,
            }
        );

        const remainingSeconds = Math.max(0, Math.floor((triggerTime - Date.now()) / 1000) + 1);

        console.log(`🔔 Test notification scheduled to trigger in ${remainingSeconds}seconds...
            channelId: ${`nejonprayer-vib-${notifSettings?.vibration}`}
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
export async function testEventNotification({ options, notifSettings, seconds = 10 }: TestParams) {
    try {
        const triggerTime = Date.now() + seconds * 1000;
        const eventName = 'Imsak';
        const body = `It is now time for (${eventName}) 04:52`;

        await notifee.createTriggerNotification(
            {
                id: "prayer-event-test",
                title: `» ${eventName} «`,
                body: body,
                data: {
                    type: "prayer-event",
                    volume: String(notifSettings?.volume ?? 1.0),
                    sound: SOUNDS.alarm2,
                },
                android: {
                    channelId: `nejonprayer-vib-${notifSettings?.vibration ?? 'short'}`,
                    category: AndroidCategory.ALARM,
                    smallIcon: "ic_stat_prayer",
                    color: AndroidColor.BLUE,
                    style: { type: AndroidStyle.INBOX, lines: [body] },
                    actions: [{ title: "OK", pressAction: { id: "OK" } }],
                    pressAction: { id: "default", launchActivity: "default" },
                    lightUpScreen: true,
                    showTimestamp: true,
                    autoCancel: false,
                    ongoing: true,
                },
                ios: {
                    categoryId: "prayer-event-category",
                    interruptionLevel: "active",
                },
            },
            {
                type: TriggerType.TIMESTAMP,
                timestamp: triggerTime,
                alarmManager: options.hasAlarm,
                // repeatFrequency: RepeatFrequency.DAILY,
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
                title: title,
                body: body,
                data: {
                    type: "prayer-reminder",
                    sound: SOUNDS.alarm1,
                },
                android: {
                    channelId: `nejonprayer-vib-${notifSettings?.vibration ?? 'short'}`,
                    category: AndroidCategory.ALARM,
                    smallIcon: "ic_stat_prayer",
                    color: AndroidColor.RED,
                    style: { type: AndroidStyle.INBOX, lines: [body] },
                    actions: [{ title: "OK", pressAction: { id: "OK" } }],
                    pressAction: { id: "default", launchActivity: "default" },
                    lightUpScreen: true,
                    showTimestamp: true,
                    autoCancel: false,
                    ongoing: true,
                },
                ios: {
                    categoryId: "prayer-reminder-category",
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
        const body = "Today is Jumu'ah. Make time for prayer.";

        await notifee.createTriggerNotification(
            {
                id: `special-friday-test-${Date.now()}`,
                title: title,
                body: body,
                data: {
                    type: "special",
                    subType: "friday-reminder",
                    scheduledFor: new Date(triggerTime).toLocaleString('en-GB'),
                },
                android: {
                    channelId: `nejonprayer-vib-off`,
                    smallIcon: "ic_stat_prayer",
                    color: AndroidColor.GREEN,
                    style: { type: AndroidStyle.INBOX, lines: [body] },
                    actions: [{ title: "OK", pressAction: { id: "OK" } }],
                    pressAction: { id: "default", launchActivity: "default" },
                    lightUpScreen: true,
                    showTimestamp: true,
                    autoCancel: false,
                    ongoing: true,
                },
                ios: {
                    categoryId: "special-category",
                    interruptionLevel: "active",
                },
            },
            {
                type: TriggerType.TIMESTAMP,
                timestamp: triggerTime,
                alarmManager: options.hasAlarm,
                // repeatFrequency: RepeatFrequency.WEEKLY,
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
                title: title,
                body: body,
                data: {
                    type: "special",
                    subType: "daily-quote",
                    scheduledFor: new Date(triggerTime).toLocaleString('en-GB'),
                },
                android: {
                    channelId: `nejonprayer-vib-off`,
                    smallIcon: "ic_stat_prayer",
                    color: AndroidColor.GREEN,
                    style: { type: AndroidStyle.BIGTEXT, text: body },
                    actions: [{ title: "OK", pressAction: { id: "OK" } }],
                    pressAction: { id: "default", launchActivity: "default" },
                    lightUpScreen: true,
                    showTimestamp: true,
                    autoCancel: false,
                    ongoing: true,
                },
                ios: {
                    categoryId: "special-category",
                    interruptionLevel: "active",
                },
            },
            {
                type: TriggerType.TIMESTAMP,
                timestamp: triggerTime,
                alarmManager: options.hasAlarm,
                // repeatFrequency: RepeatFrequency.DAILY,
            }
        );

        const remainingSeconds = Math.max(0, Math.floor((triggerTime - Date.now()) / 1000) + 1);
        console.log(`🔔 Test daily-quote notification scheduled in ${remainingSeconds}s`);
    } catch (err) {
        console.error("❌ Failed to schedule test daily-quote notification:", err);
    }
}

// ------------------------------------------------------------
// Debug utility: schedule a test Islamic Holiday notification
// ------------------------------------------------------------
export async function testHolidayNotification({ options, notifSettings, seconds = 10 }: TestParams) {
    try {
        const triggerTime = Date.now() + seconds * 1000;

        const title = "» Ramazani «";
        const body = "Muaji i shenjtë i Ramazanit · 08.02.2027";

        await notifee.createTriggerNotification(
            {
                id: `special-holiday-test-${Date.now()}`,
                title: title,
                body: body,
                data: {
                    type: "special",
                    subType: "islamic-holiday",
                    holidayType: "Ramadan",
                    scheduledFor: new Date(triggerTime).toLocaleString('en-GB'),
                },
                android: {
                    channelId: `nejonprayer-vib-off`,
                    smallIcon: "ic_stat_prayer",
                    color: AndroidColor.GREEN,
                    style: { type: AndroidStyle.INBOX, lines: [body] },
                    actions: [{ title: "OK", pressAction: { id: "OK" } }],
                    pressAction: { id: "default", launchActivity: "default" },
                    lightUpScreen: true,
                    showTimestamp: true,
                    autoCancel: false,
                    ongoing: true,
                },
                ios: {
                    categoryId: "special-category",
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
        console.log(`🔔 Test Islamic holiday notification scheduled in ${remainingSeconds}s`);
    } catch (err) {
        console.error("❌ Failed to schedule test Islamic holiday notification:", err);
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
