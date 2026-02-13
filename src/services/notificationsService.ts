// services/notificationService.ts

import { startSound, stopSound } from "@/utils/notifSound";
import notifee, {
  EventType,
  AndroidNotificationSetting,
  AndroidImportance,
  AndroidVisibility,
  TriggerType,
  RepeatFrequency,
  AndroidColor,
  AndroidStyle,
  AuthorizationStatus
} from '@notifee/react-native';
import {
  PrayerType,
  EventPrayerType,
  SpecialType,
  NotifSettings,
  PrayerSettings,
  EventSettings,
  SpecialSettings
} from '@/types/notification.types';
import { PrayerTimes } from "@/types/prayer.types";

interface ServiceSettings {
  notifSettings: NotifSettings;
  prayers: Record<PrayerType, PrayerSettings>;
  events: Record<EventPrayerType, EventSettings>;
  special: Record<SpecialType, SpecialSettings>;
}

interface ScheduleParams {
  prayerTimes: PrayerTimes;
  settings: ServiceSettings;
  language: string;
  tr: Record<string, any>; // Translation object
}

// Notification collections
const PRAYERS: PrayerType[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const PRAYER_EVENTS: EventPrayerType[] = ['Imsak', 'Sunrise'];

// ------------------------------------------------------------
// Create notification channels once (Android only)
// ------------------------------------------------------------
async function createChannels(vibration: 'on' | 'off') {
  const isVibrationEnabled = vibration === 'on';
  // Vibration pattern: 30 seconds total, 15 cycles of 1s on / 300ms off
  const vibrationPattern = Array(30).fill([1000, 300]).flat();

  const channelConfig = {
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    sound: undefined, // Sound is handled manually in the app
    vibration: isVibrationEnabled,
    vibrationPattern: isVibrationEnabled ? vibrationPattern : undefined,
    lights: true,
    lightColor: AndroidColor.WHITE,
    badge: true,
    autoCancel: false,
    ongoing: true,
    bypassDnd: true,
  };

  await notifee.createChannel({
    id: `prayer-vib-${vibration}`,
    name: 'Prayer Channel',
    description: 'Daily prayer time notifications',
    ...channelConfig,
  });

  await notifee.createChannel({
    id: `general-vib-${vibration}`,
    name: 'General Channel',
    description: 'Reminders, events and special notifications',
    ...channelConfig,
  });
}

// ------------------------------------------------------------
// Cancel all scheduled notifications
// ------------------------------------------------------------
const cancelAllNotifications = async () => {
  try {
    const scheduled = await notifee.getTriggerNotifications();
    const validTypes = ['prayer', 'prayer-event', 'prayer-reminder', 'special'];

    for (const n of scheduled) {
      const ntype = n.notification.data?.type;
      const notificationId = n.notification.id;
      if (typeof ntype === 'string' && validTypes.includes(ntype) && notificationId) {
        await notifee.cancelTriggerNotification(notificationId);
      }
    }
    console.log('🔴 All existing notifications cancelled');
  } catch (err) {
    console.error("❌ Failed to cancel notifications", err);
  }
};

// ------------------------------------------------------------
// Cancel displayed notification and stop sound
// ------------------------------------------------------------
async function cancelDisplayedNotification(notificationId: string) {
  try {
    await notifee.cancelNotification(notificationId);
    await stopSound();
  } catch (err) {
    console.error('❌ [Cleanup] Failed to clear:', err);
  }
}

// ------------------------------------------------------------
// Parse time string and calculate next trigger time with offset
// ------------------------------------------------------------
function getTriggerTime(timeStringRaw: string, offsetMinutes: number = 0): Date | null {
  // Normalize: trim whitespace and replace non-breaking spaces
  const timeString = timeStringRaw.replace(/\u00A0/g, ' ').trim();

  // Validate format: must be HH:mm (e.g., "13:45" or "5:30")
  const match = timeString.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  // Extract hour and minute
  const hour = Number(match[1]);
  const minute = Number(match[2]);

  // Create trigger time for today
  const triggerTime = new Date();
  triggerTime.setHours(hour, minute, 0, 0);

  // Apply offset (e.g., -15 = 15 minutes before, +10 = 10 minutes after)
  if (offsetMinutes !== 0) {
    triggerTime.setMinutes(triggerTime.getMinutes() + offsetMinutes);
  }

  // If time has passed today, schedule for tomorrow
  const now = new Date();
  if (triggerTime <= now) {
    triggerTime.setDate(triggerTime.getDate() + 1);
  }

  return triggerTime;
}

// ------------------------------------------------------------
// SCHEDULE: All Prayer Notifications
// ------------------------------------------------------------
async function schedulePrayerNotifications(params: ScheduleParams) {
  const { prayerTimes, settings, tr } = params;

  let count = 0;

  // Check if exact alarm permission is granted (Android 12+)
  const nf = await notifee.getNotificationSettings();
  const hasAlarm = nf.android.alarm === AndroidNotificationSetting.ENABLED;

  for (const prayer of PRAYERS) {
    // Skip disabled prayers
    if (!settings.prayers[prayer]?.enabled) continue;

    // Get time string for this prayer
    const timeString = prayerTimes[prayer];
    if (!timeString) continue;

    // Calculate trigger time with offset
    const offset = settings.prayers[prayer]?.offset || 0;
    const triggerTime = getTriggerTime(timeString, offset);
    if (!triggerTime) continue;

    // Prepare notification content
    const title = `» ${tr.prayers?.[prayer] || prayer} «`;
    const body = `${tr.labels?.prayerNotifBody || 'Time for Prayer'} (${timeString})`;
    const sound = settings.prayers[prayer]?.sound || 'azan1.mp3';

    // Create prayer notification directly
    await notifee.createTriggerNotification(
      {
        id: `prayer-${prayer.toLowerCase()}`,
        title,
        body,
        data: {
          type: 'prayer',
          prayer,
          volume: settings.notifSettings.volume,
          vibration: settings.notifSettings.vibration,
          snooze: settings.notifSettings.snooze,
          offset,
          sound,
          reminderTitle: title,
          reminderBody: tr.labels?.prayerRemindBody || 'Prayer Reminder',
        },
        android: {
          channelId: `prayer-vib-${settings.notifSettings.vibration}`,
          showTimestamp: true,
          smallIcon: 'ic_stat_prayer',
          largeIcon: require('../../assets/images/moon-islam.png'), // Custom large icon
          color: AndroidColor.OLIVE,
          pressAction: { id: 'default', launchActivity: 'default' },
          actions: [
            { title: tr.actions?.dismiss || 'Dismiss', pressAction: { id: 'dismiss' } },
            { title: tr.actions?.snooze || 'Snooze', pressAction: { id: 'snooze' } },
          ],
          style: {
            type: AndroidStyle.INBOX,
            lines: [body],
          },
          autoCancel: false,
          ongoing: true,
        },
        ios: {
          categoryId: 'prayer-category',
          critical: false,
          interruptionLevel: 'active',
        },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerTime.getTime(),
        alarmManager: hasAlarm,
        repeatFrequency: RepeatFrequency.DAILY,
      }
    );

    count++;
    const formatted = triggerTime.toLocaleString('en-GB');
    const offsetInfo = offset !== 0 ? ` (${offset > 0 ? '+' : ''}${offset} min)` : '';
    console.log(`⏰ Scheduled ${prayer} at ${formatted}${offsetInfo}`);
  }

  console.log(`✅ Scheduled ${count} prayer notification(s)`);
}

// ------------------------------------------------------------
// SCHEDULE: All Prayer Event Notifications
// ------------------------------------------------------------
async function schedulePrayerEventNotifications(params: ScheduleParams) {
  const { prayerTimes, settings, tr } = params;

  let count = 0;

  // Check if exact alarm permission is granted (Android 12+)
  const nf = await notifee.getNotificationSettings();
  const hasAlarm = nf.android.alarm === AndroidNotificationSetting.ENABLED;

  for (const event of PRAYER_EVENTS) {
    if (!settings.events[event]?.enabled) continue;

    const timeString = prayerTimes[event];
    if (!timeString) continue;

    const triggerTime = getTriggerTime(timeString, 0);
    if (!triggerTime) continue;

    const title = `» ${tr.prayers?.[event] || event} «`;
    const body = `${tr.labels?.eventNotifBody || 'Event Time'} (${timeString})`;

    // Create event notification directly
    await notifee.createTriggerNotification(
      {
        id: `event-${event.toLowerCase()}`,
        title,
        body,
        data: {
          type: 'prayer-event',
          event,
          volume: settings.notifSettings.volume,
          vibration: settings.notifSettings.vibration,
        },
        android: {
          channelId: `general-vib-${settings.notifSettings.vibration}`,
          showTimestamp: true,
          smallIcon: 'ic_stat_prayer',
          color: AndroidColor.BLUE,
          pressAction: { id: 'default', launchActivity: 'default' },
          actions: [{ title: 'OK', pressAction: { id: 'OK' } }],
          style: {
            type: AndroidStyle.INBOX,
            lines: [body],
          },
          autoCancel: true,
          ongoing: false,
        },
        ios: {
          categoryId: 'event-category',
          critical: false,
          interruptionLevel: 'active',
        },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerTime.getTime(),
        alarmManager: hasAlarm,
        repeatFrequency: RepeatFrequency.DAILY,
      }
    );

    count++;
    console.log(`📅 Scheduled ${event} at ${triggerTime.toLocaleString('en-GB')}`);
  }

  console.log(`✅ Scheduled ${count} event notification(s)`);
}

// ------------------------------------------------------------
// CREATE: Prayer Reminder (one-time, from snooze action)
// This is exported because it's called from the event handler
// ------------------------------------------------------------
export async function schedulePrayerReminder(params: {
  prayer: PrayerType;
  title: string;
  body: string;
  triggerTime: Date;
  data: Record<string, any>;
  vibration: 'on' | 'off';
  hasAlarm?: boolean;
}) {
  const { prayer, title, body, triggerTime, data, vibration, hasAlarm } = params;

  await notifee.createTriggerNotification(
    {
      id: `reminder-${prayer.toLowerCase()}-${Date.now()}`,
      title,
      body,
      data: {
        type: 'prayer-reminder',
        ...data
      },
      android: {
        channelId: `general-vib-${vibration}`,
        showTimestamp: true,
        smallIcon: 'ic_stat_prayer',
        color: AndroidColor.RED,
        pressAction: { id: 'default', launchActivity: 'default' },
        actions: [{ title: 'OK', pressAction: { id: 'OK' } }],
        autoCancel: false,
        ongoing: true,
      },
      ios: {
        categoryId: 'prayer-reminder-category',
        critical: false,
        interruptionLevel: 'active',
      },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerTime.getTime(),
      alarmManager: hasAlarm,
    }
  );
}

// ------------------------------------------------------------
// SCHEDULE: Special Notifications (Friday, Ramadan, etc.)
// ------------------------------------------------------------
async function scheduleSpecialNotifications(params: ScheduleParams) {
  const { prayerTimes, settings, tr } = params;

  let count = 0;

  // Check if exact alarm permission is granted (Android 12+)
  const nf = await notifee.getNotificationSettings();
  const hasAlarm = nf.android.alarm === AndroidNotificationSetting.ENABLED;

  // Example: Friday reminder (1 hour before Dhuhr)
  if (settings.special.Friday?.enabled) {
    const dhuhrTime = prayerTimes['Dhuhr'];
    if (dhuhrTime) {
      // Calculate next Friday
      const now = new Date();
      const daysUntilFriday = (5 - now.getDay() + 7) % 7 || 7;
      const nextFriday = new Date(now);
      nextFriday.setDate(now.getDate() + daysUntilFriday);

      // Set to 1 hour before Dhuhr
      const triggerTime = getTriggerTime(dhuhrTime, -60);
      if (triggerTime) {
        triggerTime.setDate(nextFriday.getDate());

        const title = tr.special?.fridayTitle || 'Jumu\'ah Reminder';
        const body = tr.special?.fridayBody || 'Friday prayer is in 1 hour';

        // Create special notification directly
        await notifee.createTriggerNotification(
          {
            id: 'special-friday',
            title,
            body,
            data: {
              type: 'special',
              specialType: 'Friday',
            },
            android: {
              channelId: `general-vib-${settings.notifSettings.vibration}`,
              showTimestamp: true,
              smallIcon: 'ic_stat_event',
              color: AndroidColor.GREEN,
              pressAction: { id: 'default', launchActivity: 'default' },
              actions: [{ title: 'OK', pressAction: { id: 'OK' } }],
              style: {
                type: AndroidStyle.INBOX,
                lines: [body],
              },
              autoCancel: true,
              ongoing: false,
            },
            ios: {
              categoryId: 'special-category',
              critical: false,
              interruptionLevel: 'active',
            },
          },
          {
            type: TriggerType.TIMESTAMP,
            timestamp: triggerTime.getTime(),
            alarmManager: hasAlarm,
            repeatFrequency: RepeatFrequency.WEEKLY,
          }
        );

        count++;
        console.log(`🕌 Scheduled Friday reminder at ${triggerTime.toLocaleString('en-GB')}`);
      }
    }
  }

  // Add more special notifications here (DailyQuotes, Ramadan, Eid, etc.)
  // Example:
  // if (settings.special.quotes?.enabled) {
  //   // Create Ramadan notification
  // }

  if (count > 0) {
    console.log(`✅ Scheduled ${count} special notification(s)`);
  }
}

// ------------------------------------------------------------
// MAIN: Schedule All Notifications
// ------------------------------------------------------------
export async function scheduleNotificationsService(params: ScheduleParams) {
  const { settings, prayerTimes, language } = params;

  try {
    // // Step 1: Cancel all existing
    // await cancelAllNotifications();

    // // Step 2: Create channels
    // await createChannels(params.settings.notifSettings.vibration);

    // // Step 3: Schedule prayers
    // await schedulePrayerNotifications(params);

    // // Step 4: Schedule events
    // await schedulePrayerEventNotifications(params);

    // // Step 5: Schedule special
    // await scheduleSpecialNotifications(params);

    console.log('🔔 [notificationsService] All notifications scheduled successfully');;
  } catch (err) {
    console.error('❌ Failed to schedule notifications:', err);
    throw err;
  }
}

// ------------------------------------------------------------
// EVENT HANDLER: Handle notification interactions
// ------------------------------------------------------------
export async function handleNotificationEvent(
  type: EventType,
  notification: any,
  pressAction: any,
  source: string = 'unknown'
) {
  // Check device-level notification permission first
  const nf = await notifee.getNotificationSettings();

  // Early exit: do not play sound or handle anything
  if (nf.authorizationStatus !== AuthorizationStatus.AUTHORIZED) {
    console.log(`[${source}] Notifications are disabled on device — ignoring event`);
    return;
  }

  // Check if exact alarms are available
  const hasAlarm = nf.android.alarm === AndroidNotificationSetting.ENABLED;

  // Prefix for logs based on event source
  const prefix = source === 'background' ? '[Background]' : '[Foreground]';

  const notifType = notification?.data?.type;
  const prayer = notification?.data?.prayer;
  const reminderTitle = notification?.data?.reminderTitle;
  const reminderBody = notification?.data?.reminderBody;
  const language = notification?.data?.language ?? 'en';
  const volume = Number(notification?.data?.volume ?? 1.0);
  const vibration = notification?.data?.vibration ?? 'on';
  const snooze = Number(notification?.data?.snooze ?? 5);
  const offset = Number(notification?.data?.offset ?? 0);

  switch (type) {
    case EventType.DELIVERED:
      // Notification was delivered and shown to user
      console.log(`✅ ${prefix} Notification delivered`);

      // For prayer notification
      if (notifType === "prayer") {
        // @TODO: will be implemented in future - allow users to choose different sounds for each prayer
        // const soundFile = notification?.data?.sound || 'azan1.mp3';
        // await startSound(soundFile, volume);
        await startSound('azan1.mp3', volume); // 29sec - Azan for prayers
      }
      // For prayer reminder/event notification
      else if (notifType === "prayer-event" || notifType === "prayer-reminder" || notifType === "special") {
        await startSound('beep1.mp3', volume); // 25sec - Beep for events/reminders
      }
      break;

    case EventType.ACTION_PRESS:
      // User pressed an action button
      switch (pressAction?.id) {
        case 'dismiss':
          // "Dismiss" button pressed (prayers only)
          console.log(`🔘 ${prefix} Notification "Dismiss" pressed`);
          await cancelDisplayedNotification(notification.id);
          break;

        case 'snooze':
          // "Remind me later" action button pressed (prayers only)
          console.log(`⏰ ${prefix} Notification "Remind me later" pressed. Trigger in (${snooze}min)...`);

          await schedulePrayerReminder({
            prayer,
            title: reminderTitle,
            body: reminderBody,
            triggerTime: new Date(Date.now() + snooze * 60 * 1000), // Trigger after snooze minutes
            data: {
              type: notifType,
              prayer: prayer,
              language: language,
              volume: String(volume),
              vibration: vibration,
              snooze: String(snooze),
              offset: String(offset),
            },
            vibration,
            hasAlarm,
          });

          // Cancel the current notification
          await cancelDisplayedNotification(notification.id);
          break;

        case 'OK':
          // OK button pressed (events, reminders, specials)
          console.log(`✅ ${prefix} Notification Reminder "OK" pressed`);
          await cancelDisplayedNotification(notification.id);
          break;
      }
      break;

    case EventType.PRESS:
      // User tapped the notification body
      console.log(`👆 ${prefix} Notification pressed`);
      await cancelDisplayedNotification(notification.id);
      break;

    case EventType.DISMISSED:
      // User swiped away the notification
      console.log(`👆 ${prefix} Notification dismissed`);
      await cancelDisplayedNotification(notification.id);
      break;
  }
}

// ------------------------------------------------------------
// USAGE EXAMPLES
// ------------------------------------------------------------
// In RootLayout:
// useNotificationsSync();

// In languageStore.setLanguage():
// useNotificationsStore.getState().scheduleNotifications();

// In prayersStore.loadPrayerTimes():
// if (timesChanged) {
//   await useNotificationsStore.getState().scheduleNotifications();
// }

// In Settings UI:
// const { savePrayerSettings } = useNotificationsStore();
// savePrayerSettings('Fajr', true, -15);