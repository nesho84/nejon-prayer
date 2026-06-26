import { SOUNDS } from "@/constants/sounds";
import { getVibrationChannelId } from "@/services/notificationsService";
import { Cords } from "@/types/location.types";
import { NotifSettings } from "@/types/notification.types";
import { toDateKey } from "@/utils/datetime";
import { Alert } from "react-native";
import notifee, {
    AndroidCategory,
    AndroidColor,
    AndroidStyle,
    AuthorizationStatus,
    TimestampTrigger,
    TriggerType
} from "react-native-notify-kit";

interface DebugNParams {
    options: {
        language: string;
        location?: Cords | null;
        hasAlarm?: boolean;
    },
    notifSettings?: NotifSettings | null;
    seconds?: number;
}

// ------------------------------------------------------------
// Bail out (with a heads-up alert) if notifications are disabled on the
// device — otherwise the test schedules silently and never fires
// ------------------------------------------------------------
async function notificationsAreOff(): Promise<boolean> {
    const { authorizationStatus } = await notifee.getNotificationSettings();
    const off = authorizationStatus !== AuthorizationStatus.AUTHORIZED;
    if (off) {
        Alert.alert("Notifications are off", "Enable notifications for this app in system settings to test this.");
    }
    return off;
}

// ------------------------------------------------------------
// Debug utility: schedule a test prayer notification
// ------------------------------------------------------------
export async function debugPrayerN({ options, notifSettings, seconds = 10 }: DebugNParams) {
    try {
        if (await notificationsAreOff()) return;

        // Default to 10 seconds later if no timestamp passed
        const triggerTime = Date.now() + seconds * 1000;

        // Prepare notification content
        const title = `» Sabahu «`;
        const body = `Koha për namaz (06:49)`;
        const sound = SOUNDS.azan1_short;
        const volume = String(notifSettings?.volume ?? 1.0);
        const vibration = notifSettings?.vibration ?? 'short';
        const snooze = String(notifSettings?.snooze ?? 5);
        const reminderTitle = `» Sabahu «`;
        const reminderBody = `Kujtesë Lutjeje`;

        await notifee.createTriggerNotification(
            {
                id: "prayer-test",
                title: title,
                body: body,
                data: {
                    type: "prayer",
                    volume: volume,
                    sound: sound,
                    vibration: vibration,
                    snooze: snooze,
                    prayerName: 'Fajr',
                    prayerDate: toDateKey(new Date(triggerTime)),
                    reminderTitle: reminderTitle,
                    reminderBody: reminderBody,
                },
                android: {
                    channelId: getVibrationChannelId(vibration),
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
            channelId: ${getVibrationChannelId(vibration)}
            language: ${options?.language},
            alarm: ${options.hasAlarm},
            volume: ${volume},
            vibration: ${vibration},
            snooze: ${snooze}
            `);

    } catch (err) {
        console.error("❌ Failed to schedule test notification:", err);
    }
}

// ------------------------------------------------------------
// Debug utility: schedule a test prayer-event notification (Imsak/Sunrise)
// ------------------------------------------------------------
export async function debugEventN({ options, notifSettings, seconds = 10 }: DebugNParams) {
    try {
        if (await notificationsAreOff()) return;

        // Default to 10 seconds later if no timestamp passed
        const triggerTime = Date.now() + seconds * 1000;

        // Prepare notification content
        const title = `» Imsak «`;
        const body = `It is now time for (Imsak) 04:52`;
        const sound = SOUNDS.alarm2;
        const volume = String(notifSettings?.volume ?? 1.0);
        const vibration = notifSettings?.vibration;

        await notifee.createTriggerNotification(
            {
                id: "prayer-event-test",
                title: title,
                body: body,
                data: {
                    type: "prayer-event",
                    volume: volume,
                    sound: sound,
                },
                android: {
                    channelId: getVibrationChannelId(vibration),
                    category: AndroidCategory.ALARM,
                    smallIcon: "ic_stat_prayer",
                    color: AndroidColor.BLUE,
                    style: { type: AndroidStyle.INBOX, lines: [body] },
                    pressAction: { id: "default", launchActivity: "default" },
                    lightUpScreen: true,
                    showTimestamp: true,
                    autoCancel: false,
                    ongoing: true,
                },
                ios: {
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
export async function debugPrayerReminderN({ options, notifSettings = null, seconds = 10 }: DebugNParams) {
    try {
        if (await notificationsAreOff()) return;

        const triggerTime = Date.now() + seconds * 1000;

        // Prepare notification content
        const title = `» Sabahu «`;
        const body = `Kujtesë Lutjeje`;
        const sound = SOUNDS.alarm1;
        const vibration = notifSettings?.vibration;

        await notifee.createTriggerNotification(
            {
                id: `reminder-test-${Date.now()}`,
                title: title,
                body: body,
                data: {
                    type: "prayer-reminder",
                    sound: sound,
                },
                android: {
                    channelId: getVibrationChannelId(vibration),
                    category: AndroidCategory.ALARM,
                    smallIcon: "ic_stat_prayer",
                    color: AndroidColor.RED,
                    style: { type: AndroidStyle.INBOX, lines: [body] },
                    pressAction: { id: "default", launchActivity: "default" },
                    lightUpScreen: true,
                    showTimestamp: true,
                    autoCancel: false,
                    ongoing: true,
                },
                ios: {
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
export async function debugFridayN({ options, notifSettings, seconds = 10 }: DebugNParams) {
    try {
        if (await notificationsAreOff()) return;

        const triggerTime = Date.now() + seconds * 1000;

        // Prepare notification content
        const title = `Jumu'ah Reminder`;
        const body = `Today is Jumu'ah. Make time for prayer.`;
        const vibration = notifSettings?.vibration === 'off' ? 'off' : 'short';

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
                    channelId: getVibrationChannelId(vibration),
                    smallIcon: "ic_stat_prayer",
                    color: AndroidColor.GREEN,
                    style: { type: AndroidStyle.INBOX, lines: [body] },
                    pressAction: { id: "default", launchActivity: "default" },
                    lightUpScreen: true,
                    showTimestamp: true,
                    autoCancel: false,
                    ongoing: true,
                },
                ios: {
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
// Debug utility: schedule a test Islamic Holiday notification
// ------------------------------------------------------------
export async function debugHolidayN({ options, notifSettings, seconds = 10 }: DebugNParams) {
    try {
        if (await notificationsAreOff()) return;

        const triggerTime = Date.now() + seconds * 1000;

        // Prepare notification content
        const title = `» Ramazani «`;
        const body = `Muaji i shenjtë i Ramazanit · 08.02.2027`;
        const vibration = notifSettings?.vibration === 'off' ? 'off' : 'short';

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
                    channelId: getVibrationChannelId(vibration),
                    smallIcon: "ic_stat_prayer",
                    color: AndroidColor.GREEN,
                    style: { type: AndroidStyle.INBOX, lines: [body] },
                    pressAction: { id: "default", launchActivity: "default" },
                    lightUpScreen: true,
                    showTimestamp: true,
                    autoCancel: false,
                    ongoing: true,
                },
                ios: {
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
// Debug utility: schedule a test Daily Quote special notification
// ------------------------------------------------------------
export async function debugDailyQuoteN({ options, notifSettings, seconds = 10 }: DebugNParams) {
    try {
        if (await notificationsAreOff()) return;

        const triggerTime = Date.now() + seconds * 1000;

        // Prepare notification content
        const title = `Daily Reminder`;
        const body = `Verily, in the remembrance of Allah do hearts find rest 💚 (Ar-Ra'd 13:28)`;
        const vibration = notifSettings?.vibration === 'off' ? 'off' : 'short';

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
                    channelId: getVibrationChannelId(vibration),
                    smallIcon: "ic_stat_prayer",
                    color: AndroidColor.GREEN,
                    style: { type: AndroidStyle.BIGTEXT, text: body },
                    pressAction: { id: "default", launchActivity: "default" },
                    lightUpScreen: true,
                    showTimestamp: true,
                    autoCancel: false,
                    ongoing: true,
                },
                ios: {
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
// Debug utility: log all channels and scheduled notifications
// ------------------------------------------------------------
export async function debugScheduledN() {
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
