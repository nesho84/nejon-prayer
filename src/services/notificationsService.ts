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
  PrayerEventType,
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
  events: Record<PrayerEventType, EventSettings>;
  special: Record<SpecialType, SpecialSettings>;
}

interface ScheduleParams {
  prayerTimes: PrayerTimes;
  config: ServiceSettings;
  language: string;
  tr: Record<string, any>;
}

// Notification collections
const PRAYERS: PrayerType[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const PRAYER_EVENTS: PrayerEventType[] = ['Imsak', 'Sunrise'];
const SPECIAL: SpecialType[] = ['Friday', 'Ramadan', 'Eid', 'DailyQuote'];

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
// PRAYER SCHEDULE: All Prayer Notifications
// ------------------------------------------------------------
async function schedulePrayerNotifications(params: ScheduleParams) {
  const { prayerTimes, config, tr } = params;

  let count = 0;

  // Check if exact alarm permission is granted (Android 12+)
  const nf = await notifee.getNotificationSettings();
  const hasAlarm = nf.android.alarm === AndroidNotificationSetting.ENABLED;

  for (const prayer of PRAYERS) {
    // Skip disabled prayers
    if (!config.prayers[prayer]?.enabled) continue;

    // Get time string for this prayer
    const timeString = prayerTimes[prayer];
    if (!timeString) continue;

    // Calculate trigger time with offset
    const offset = config.prayers[prayer]?.offset || 0;
    const triggerTime = getTriggerTime(timeString, offset);
    if (!triggerTime) continue;

    // Prepare notification content
    const title = `» ${tr.prayers?.[prayer] || prayer} «`;
    const body = `${tr.labels?.prayerNotifBody || 'Time for Prayer'} (${timeString})`;
    const sound = config.prayers[prayer]?.sound || 'azan1.mp3';

    // Create prayer notification
    await notifee.createTriggerNotification(
      {
        id: `prayer-${prayer.toLowerCase()}`,
        title,
        body,
        data: {
          type: 'prayer',
          prayer,
          volume: config.notifSettings.volume,
          vibration: config.notifSettings.vibration,
          snooze: config.notifSettings.snooze,
          offset,
          sound,
          reminderTitle: title,
          reminderBody: tr.labels?.prayerRemindBody || 'Prayer Reminder',
        },
        android: {
          channelId: `prayer-vib-${config.notifSettings.vibration}`,
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
// PRAYER-EVENT SCHEDULE: All Prayer Event Notifications
// ------------------------------------------------------------
async function schedulePrayerEventNotifications(params: ScheduleParams) {
  const { prayerTimes, config, tr } = params;

  let count = 0;

  // Check if exact alarm permission is granted (Android 12+)
  const nf = await notifee.getNotificationSettings();
  const hasAlarm = nf.android.alarm === AndroidNotificationSetting.ENABLED;

  for (const event of PRAYER_EVENTS) {
    // Skip disabled events
    if (!config.events[event]?.enabled) continue;

    // Get time string for this prayer
    const timeString = prayerTimes[event];
    if (!timeString) continue;

    // Calculate trigger time with offset
    const offset = config.events[event]?.offset || 0;
    const triggerTime = getTriggerTime(timeString, offset);
    if (!triggerTime) continue;

    // Prepare notification content
    const title = `» ${tr.prayers?.[event] || event} «`;
    const body = `${tr.labels?.eventNotifBody || 'Event Time'} (${timeString})`;
    const sound = config.events[event]?.sound || 'azan1.mp3';

    // Create event notification
    await notifee.createTriggerNotification(
      {
        id: `event-${event.toLowerCase()}`,
        title,
        body,
        data: {
          type: 'prayer-event',
          event,
          volume: config.notifSettings.volume,
          vibration: config.notifSettings.vibration,
          snooze: config.notifSettings.snooze,
          offset,
          sound,
        },
        android: {
          channelId: `general-vib-${config.notifSettings.vibration}`,
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
    const formatted = triggerTime.toLocaleString('en-GB');
    const offsetInfo = offset !== 0 ? ` (${offset > 0 ? '+' : ''}${offset} min)` : '';
    console.log(`⏰ Scheduled ${event} at ${formatted}${offsetInfo}`);
  }

  console.log(`✅ Scheduled ${count} event notification(s)`);
}

// ------------------------------------------------------------
// SPECIAL SCHEDULE: Special Notifications (Friday, Ramadan, etc.)
// ------------------------------------------------------------
async function scheduleSpecialNotifications(params: ScheduleParams) {
  const { prayerTimes, config, tr } = params;

  let count = 0;

  // Check if exact alarm permission is granted (Android 12+)
  const nf = await notifee.getNotificationSettings();
  const hasAlarm = nf.android.alarm === AndroidNotificationSetting.ENABLED;

  // Special 1: Friday reminder (1 hour before Dhuhr)
  if (config.special.Friday?.enabled) {
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

        // Prepare notification content
        const title = tr.special?.fridayTitle || 'Jumu\'ah Reminder';
        const body = tr.special?.fridayBody || 'Friday prayer is in 1 hour';

        // Create special notification
        await notifee.createTriggerNotification(
          {
            id: `special-friday`,
            title,
            body,
            data: {
              type: 'special',
              specialType: 'Friday',
            },
            android: {
              channelId: `general-vib-${config.notifSettings.vibration}`,
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
  //   // Create DailyQuote notification
  // }

  if (count > 0) {
    console.log(`✅ Scheduled ${count} special notification(s)`);
  }
}

// ------------------------------------------------------------
// PRAYER-REMINDER CREATE: Prayer Reminder (one-time, from snooze action)
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

  // Create prayer reminder notification
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
// MAIN: Schedule All Notifications
// ------------------------------------------------------------
export async function scheduleNotificationsService(params: ScheduleParams) {
  const { config, prayerTimes, language } = params;

  try {
    // 1: Cancel all existing
    await cancelAllNotifications();

    // 2: Create channels
    await createChannels(config.notifSettings.vibration);

    // 3: Schedule prayers
    await schedulePrayerNotifications(params);

    // 4: Schedule events
    await schedulePrayerEventNotifications(params);

    // 5: Schedule special
    await scheduleSpecialNotifications(params);

    console.log('🔔 [notificationsService] All notifications scheduled successfully.');;
  } catch (err) {
    console.error('❌ Failed to schedule notifications:', err);
    throw err;
  }
}

// ------------------------------------------------------------
// EVENT HANDLER: Handle NotifY notification interactions
// ------------------------------------------------------------
export async function handleNotificationEvent(type: EventType, notification: any, pressAction: any, source: string = 'unknown') {
  // Check if exact alarm permission is granted (Android 12+)
  const nf = await notifee.getNotificationSettings();
  const hasAlarm = nf.android.alarm === AndroidNotificationSetting.ENABLED;

  // Early exit: do not play sound or handle anything
  if (nf.authorizationStatus !== AuthorizationStatus.AUTHORIZED) {
    console.log(`[${source}] Notifications are disabled on device — ignoring event`);
    return;
  }

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
  const sound = notification?.data?.sound || 'azan1.mp3';

  switch (type) {
    case EventType.DELIVERED:
      // Notification was delivered and shown to user
      console.log(`✅ ${prefix} Notification delivered`);

      // For prayer and prayer-event notification
      if (notifType === "prayer" || notifType === "prayer-event") {
        await startSound(sound, volume); // 29sec - Azan
      }
      // For prayer-reminder notification
      else if (notifType === "prayer-reminder") {
        await startSound('beep1.mp3', volume); // 25sec - Beep
      }
      else if (notifType === "special") {
        // No sound for specials for now
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
