// // constants/notifications.js
// // Single source of truth for all notifications (pure data + tiny helpers).
// // No runtime side-effects. Helpers are pure and safe to import anywhere.

// import { AndroidColor } from '@notifee/react-native';

// export const NOTIFICATIONS = [
//     // -------------------------
//     // PRAYER NOTIFICATIONS
//     // -------------------------
//     {
//         id: 'prayer-fajr',
//         name: 'Fajr',
//         type: 'prayer',
//         titleKey: 'prayers.Fajr',
//         bodyKey: 'labels.prayerNotifBody',
//         reminderBodyKey: 'labels.prayerRemindBody',
//         channel: 'prayer',
//         sound: 'azan1.mp3',
//         color: AndroidColor.OLIVE,
//         categoryId: 'prayer-category',
//         repeat: 'daily', // 'daily' | 'weekly' | 'monthly' | 'none'
//         offset: -15,     // default offset in minutes (negative = before)
//         enabled: true,   // default enabled state (context may override)
//         actions: [
//             { id: 'dismiss', titleKey: 'actions.dismiss' },
//             { id: 'snooze', titleKey: 'actions.snooze' }
//         ],
//     },
//     {
//         id: 'prayer-dhuhr',
//         name: 'Dhuhr',
//         type: 'prayer',
//         titleKey: 'prayers.Dhuhr',
//         bodyKey: 'labels.prayerNotifBody',
//         reminderBodyKey: 'labels.prayerRemindBody',
//         channel: 'prayer',
//         sound: 'azan1.mp3',
//         color: AndroidColor.OLIVE,
//         categoryId: 'prayer-category',
//         repeat: 'daily',
//         offset: 0,
//         enabled: true,
//         actions: [
//             { id: 'dismiss', titleKey: 'actions.dismiss' },
//             { id: 'snooze', titleKey: 'actions.snooze' }
//         ],
//     },
//     {
//         id: 'prayer-asr',
//         name: 'Asr',
//         type: 'prayer',
//         titleKey: 'prayers.Asr',
//         bodyKey: 'labels.prayerNotifBody',
//         reminderBodyKey: 'labels.prayerRemindBody',
//         channel: 'prayer',
//         sound: 'azan1.mp3',
//         color: AndroidColor.OLIVE,
//         categoryId: 'prayer-category',
//         repeat: 'daily',
//         offset: 0,
//         enabled: true,
//         actions: [
//             { id: 'dismiss', titleKey: 'actions.dismiss' },
//             { id: 'snooze', titleKey: 'actions.snooze' }
//         ],
//     },
//     {
//         id: 'prayer-maghrib',
//         name: 'Maghrib',
//         type: 'prayer',
//         titleKey: 'prayers.Maghrib',
//         bodyKey: 'labels.prayerNotifBody',
//         reminderBodyKey: 'labels.prayerRemindBody',
//         channel: 'prayer',
//         sound: 'azan1.mp3',
//         color: AndroidColor.OLIVE,
//         categoryId: 'prayer-category',
//         repeat: 'daily',
//         offset: 0,
//         enabled: true,
//         actions: [
//             { id: 'dismiss', titleKey: 'actions.dismiss' },
//             { id: 'snooze', titleKey: 'actions.snooze' }
//         ],
//     },
//     {
//         id: 'prayer-isha',
//         name: 'Isha',
//         type: 'prayer',
//         titleKey: 'prayers.Isha',
//         bodyKey: 'labels.prayerNotifBody',
//         reminderBodyKey: 'labels.prayerRemindBody',
//         channel: 'prayer',
//         sound: 'azan1.mp3',
//         color: AndroidColor.OLIVE,
//         categoryId: 'prayer-category',
//         repeat: 'daily',
//         offset: 0,
//         enabled: true,
//         actions: [
//             { id: 'dismiss', titleKey: 'actions.dismiss' },
//             { id: 'snooze', titleKey: 'actions.snooze' }
//         ],
//     },

//     // -------------------------
//     // SINGLE REMINDER (snooze)
//     // -------------------------
//     {
//         id: 'prayer-reminder',
//         name: 'Reminder',
//         type: 'prayer-reminder',
//         titleKey: 'labels.reminderTitle',
//         bodyKey: 'labels.reminderNotifBody',
//         channel: 'general',
//         sound: 'beep1.mp3',
//         color: AndroidColor.RED,
//         categoryId: 'prayer-reminder-category',
//         repeat: 'none',
//         offset: 0,
//         enabled: true,
//         actions: [
//             { id: 'OK', titleKey: 'actions.ok' }
//         ],
//     },

//     // -------------------------
//     // EVENTS (Imsak, Sunrise)
//     // -------------------------
//     {
//         id: 'event-imsak',
//         name: 'Imsak',
//         type: 'event',
//         titleKey: 'prayers.Imsak',
//         bodyKey: 'labels.eventNotifBody',
//         channel: 'general',
//         sound: 'beep1.mp3',
//         color: AndroidColor.BLUE,
//         categoryId: 'event-category',
//         repeat: 'daily',
//         offset: 0,
//         enabled: false,
//         actions: [
//             { id: 'OK', titleKey: 'actions.ok' }
//         ],
//     },
//     {
//         id: 'event-sunrise',
//         name: 'Sunrise',
//         type: 'event',
//         titleKey: 'prayers.Sunrise',
//         bodyKey: 'labels.eventNotifBody',
//         channel: 'general',
//         sound: 'beep1.mp3',
//         color: AndroidColor.BLUE,
//         categoryId: 'event-category',
//         repeat: 'daily',
//         offset: 0,
//         enabled: false,
//         actions: [
//             { id: 'OK', titleKey: 'actions.ok' }
//         ],
//     },
// ];



// // ------------------------------------------------------------
// // Convenience lookups & helpers
// // ------------------------------------------------------------

// // ------------------------------------------------------------
// /**
//  * Find notification config by id (stable)
//  * @param {string} id
//  * @returns notification object | undefined
//  */
// // ------------------------------------------------------------
// export function getById(id) {
//     return NOTIFICATIONS.find(n => n.id === id);
// }

// // ------------------------------------------------------------
// /**
//  * Find notification config by human name (e.g. "Fajr")
//  * @param {string} name
//  * @returns notification object | undefined
//  */
// // ------------------------------------------------------------
// export function getByName(name) {
//     return NOTIFICATIONS.find(n => n.name === name);
// }

// // ------------------------------------------------------------
// /**
//  * Build translated Notifee-style action objects for a notification config item.
//  * Example return:
//  * [
//  *   { title: 'Dismiss', pressAction: { id: 'dismiss' } },
//  *   { title: 'Snooze',  pressAction: { id: 'snooze' } },
//  * ]
//  *
//  * @param {object} item - notification config item
//  * @param {function} tr - translation function: tr('actions.dismiss') => 'Dismiss'
//  * @returns {Array<{title: string, pressAction: {id: string}}>}
//  */
// // ------------------------------------------------------------
// export function getActions(item, tr) {
//     if (!item || !item.actions) return [];

//     const actionsArray = [];

//     for (const action of item.actions) {
//         actionsArray.push({
//             title: tr(action.titleKey),
//             pressAction: { id: action.id },
//         });
//     }

//     return actionsArray;
// }





// // ------------------------------------------------------------
// // ✅ Example usage in scheduling:
// // ------------------------------------------------------------

// const notifItem = getById('prayer-fajr');

// await notifee.createTriggerNotification(
//     {
//         id: notifItem.id,
//         title: tr(notifItem.titleKey),
//         body: tr(notifItem.bodyKey),
//         data: {
//             type: notifItem.type,
//             prayer: notifItem.name
//         },
//         android: {
//             channelId: notifItem.channel + "-vib-on",
//             color: notifItem.color,
//             actions: getActions(notifItem, tr),
//         },
//         ios: { categoryId: notifItem.categoryId }
//     },
//     { type: TriggerType.TIMESTAMP, timestamp: Date.now() + 1000 }
// );