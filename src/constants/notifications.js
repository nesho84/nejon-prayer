import { AndroidColor } from "@notifee/react-native";

export const DEFAULT_NOTIFICATION_SETTINGS = {
    volume: 1,
    vibration: "on",
    snooze: 5,

    prayers: [
        {
            id: 'prayer-fajr',
            name: 'Fajr',
            type: 'prayer',
            enabled: true,
            offset: 0,
            sound: 'azan1.mp3',
            channel: 'prayer',
            color: AndroidColor.OLIVE,
            categoryId: 'prayer-category',
            titleKey: 'prayers.Fajr',
            bodyKey: 'labels.prayerNotifBody',
            reminderBodyKey: 'labels.prayerRemindBody',
            actions: ['dismiss', 'snooze'],
            schedule: { type: 'daily' }
        },
        {
            id: 'prayer-dhuhr',
            name: 'Dhuhr',
            type: 'prayer',
            enabled: true,
            offset: 0,
            sound: 'azan1.mp3',
            channel: 'prayer',
            color: AndroidColor.OLIVE,
            categoryId: 'prayer-category',
            titleKey: 'prayers.Dhuhr',
            bodyKey: 'labels.prayerNotifBody',
            reminderBodyKey: 'labels.prayerRemindBody',
            actions: ['dismiss', 'snooze'],
            schedule: { type: 'daily' }
        },
        {
            id: 'prayer-asr',
            name: 'Asr',
            type: 'prayer',
            enabled: true,
            offset: 0,
            sound: 'azan1.mp3',
            channel: 'prayer',
            color: AndroidColor.OLIVE,
            categoryId: 'prayer-category',
            titleKey: 'prayers.Asr',
            bodyKey: 'labels.prayerNotifBody',
            reminderBodyKey: 'labels.prayerRemindBody',
            actions: ['dismiss', 'snooze'],
            schedule: { type: 'daily' }
        },
        {
            id: 'prayer-maghrib',
            name: 'Maghrib',
            type: 'prayer',
            enabled: true,
            offset: 0,
            sound: 'azan1.mp3',
            channel: 'prayer',
            color: AndroidColor.OLIVE,
            categoryId: 'prayer-category',
            titleKey: 'prayers.Maghrib',
            bodyKey: 'labels.prayerNotifBody',
            reminderBodyKey: 'labels.prayerRemindBody',
            actions: ['dismiss', 'snooze'],
            schedule: { type: 'daily' }
        },
        {
            id: 'prayer-isha',
            name: 'Isha',
            type: 'prayer',
            enabled: true,
            offset: 0,
            sound: 'azan1.mp3',
            channel: 'prayer',
            color: AndroidColor.OLIVE,
            categoryId: 'prayer-category',
            titleKey: 'prayers.Isha',
            bodyKey: 'labels.prayerNotifBody',
            reminderBodyKey: 'labels.prayerRemindBody',
            actions: ['dismiss', 'snooze'],
            schedule: { type: 'daily' }
        }
    ],

    events: [
        {
            id: 'event-imsak',
            name: 'Imsak',
            type: 'event',
            enabled: false,
            offset: 0,
            sound: 'beep1.mp3',
            channel: 'general',
            color: AndroidColor.BLUE,
            categoryId: 'event-category',
            titleKey: 'prayers.Imsak',
            bodyKey: 'labels.eventNotifBody',
            actions: ['ok'],
            schedule: { type: 'daily' }
        },
        {
            id: 'event-sunrise',
            name: 'Sunrise',
            type: 'event',
            enabled: false,
            offset: 0,
            sound: 'beep1.mp3',
            channel: 'general',
            color: AndroidColor.BLUE,
            categoryId: 'event-category',
            titleKey: 'prayers.Sunrise',
            bodyKey: 'labels.eventNotifBody',
            actions: ['ok'],
            schedule: { type: 'daily' }
        },
        {
            id: 'event-jumuah',
            name: 'Jumuah',
            type: 'event',
            enabled: true,
            offset: -60,
            sound: null,
            channel: 'general',
            color: AndroidColor.GREEN,
            categoryId: 'event-category',
            titleKey: 'prayers.Jumuah',
            bodyKey: 'labels.jumuahReminder',
            actions: [],
            schedule: {
                type: 'weekly',
                dayOfWeek: 5,
                baseTime: 'Dhuhr',
            }
        }
    ],

    reminders: [
        {
            id: 'prayer-reminder',
            name: 'Reminder',
            type: 'prayer-reminder',
            sound: 'beep1.mp3',
            channel: 'general',
            color: AndroidColor.RED,
            categoryId: 'prayer-reminder-category',
            titleKey: 'labels.prayerRemindTitle',
            bodyKey: 'labels.prayerRemindBody',
            actions: ['ok']
        }
    ],
};