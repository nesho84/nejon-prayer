import { QUOTES } from "@/constants/quotes";
import { SOUNDS } from "@/constants/sounds";
import { startSound, stopSound } from "@/services/soundService";
import { Language, Translations } from '@/types/language.types';
import { EventSettings, NotifSettings, PrayerEventType, PrayerSettings, PrayerType, SpecialSettings, SpecialType } from '@/types/notification.types';
import { PrayerTimes } from "@/types/prayer.types";
import notifee, { AndroidColor, AndroidImportance, AndroidNotificationSetting, AndroidStyle, AndroidVisibility, AuthorizationStatus, EventType, RepeatFrequency, TriggerType } from '@notifee/react-native';
import { Platform } from "react-native";

interface ScheduleParams {
  prayerTimes: PrayerTimes;
  config: {
    notifSettings: NotifSettings;
    prayers: Record<PrayerType, PrayerSettings>;
    events: Record<PrayerEventType, EventSettings>;
    specials: Record<SpecialType, SpecialSettings>;
  };
  language: Language;
  tr: Translations;
  hasAlarm?: boolean;
}

const PRAYERS: PrayerType[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const EVENTS: PrayerEventType[] = ['Imsak', 'Sunrise'];

// ------------------------------------------------------------
// MAIN SCHEDULING: Called in notificationsStore when prayer times or settings change
// ------------------------------------------------------------
export async function scheduleNotificationsService(params: ScheduleParams) {
  // Note: Channels created in useNotificationsSync on app load
  try {
    // Cancel all existing notifications
    await cancelAllNotifications();

    // Get current notification settings and set exact alarm permission (Android 12+)
    const ns = await notifee.getNotificationSettings();
    params.hasAlarm = ns.android.alarm === AndroidNotificationSetting.ENABLED;

    // Schedule all notification types
    await schedulePrayerNotifications(params);
    await scheduleEventNotifications(params);
    await scheduleSpecialNotifications(params);

  } catch (err) {
    console.error('❌ [notificationsService] Failed to schedule notifications:', err);
    throw err;
  }
}

// ------------------------------------------------------------
// Create channels: Called in useNotificationsSync on app load
// ------------------------------------------------------------
export async function createNotificationsChannels() {
  if (Platform.OS !== 'android') return;

  // = 1000 + (21 × 1300) = 28,300ms = 28.3 seconds
  const vibrationPattern = Array(21).fill([1000, 300]).flat();

  // Default channel config
  const defaults = {
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    sound: undefined, // Sound is handled manually in the app
    lights: true,
    lightColor: AndroidColor.WHITE,
    badge: true,
    autoCancel: false,
    ongoing: true,
    bypassDnd: true,
  };

  await notifee.createChannel({
    id: 'nejonprayer-vib-on',
    name: 'Channel with vibration ON',
    description: 'Nejon-Prayer Channel With vibration and custom pattern',
    vibration: true,
    vibrationPattern: vibrationPattern,
    ...defaults,
  });
  await notifee.createChannel({
    id: 'nejonprayer-vib-off',
    name: 'Channel with vibration OFF',
    description: 'Nejon-Prayer Channel Without vibration',
    vibration: false,
    vibrationPattern: undefined,
    ...defaults,
  });
}

// ------------------------------------------------------------
// Cancel all scheduled notifications
// ------------------------------------------------------------
async function cancelAllNotifications() {
  const notifTypes = ['prayer', 'prayer-event', 'special', 'prayer-reminder'];
  try {
    const scheduled = await notifee.getTriggerNotifications();
    for (const n of scheduled) {
      const ntype = n.notification.data?.type;
      const notificationId = n.notification.id;
      if (typeof ntype === 'string' && notifTypes.includes(ntype) && notificationId) {
        await notifee.cancelTriggerNotification(notificationId);
      }
    }
    console.log('🔴 All existing notifications cancelled');
  } catch (err) {
    console.error("❌ Failed to cancel notifications", err);
  }
}

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
  const { config, prayerTimes, language, tr, hasAlarm } = params;

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
    const body = `${tr.labels?.prayerNotifBody} (${timeString})`;
    const sound = config.prayers[prayer]?.sound;

    // Create prayer notification
    await notifee.createTriggerNotification(
      {
        id: `prayer-${prayer.toLowerCase()}`,
        title: title,
        body: body,
        data: {
          type: 'prayer',
          prayerName: prayer,
          volume: config.notifSettings.volume,
          vibration: config.notifSettings.vibration, // for the reminder to choose the right channel
          snooze: config.notifSettings.snooze, // for the reminder to set the right time
          sound: sound ?? '',
          reminderTitle: title,
          reminderBody: tr.labels?.prayerRemindBody || 'Prayer Reminder',
        },
        android: {
          channelId: `nejonprayer-vib-${config.notifSettings.vibration}`,
          showTimestamp: true,
          smallIcon: 'ic_stat_prayer',
          largeIcon: require('../../assets/images/moon-islam.png'),
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

    const formatted = triggerTime.toLocaleString('en-GB');
    const offsetInfo = offset !== 0 ? ` (${offset > 0 ? '+' : ''}${offset} min)` : '';
    console.log(`⏰ Scheduled ${tr.prayers?.[prayer]} at ${formatted}${offsetInfo}`);
  }
}

// ------------------------------------------------------------
// PRAYER-EVENT SCHEDULE: All Prayer Event Notifications
// ------------------------------------------------------------
async function scheduleEventNotifications(params: ScheduleParams) {
  const { config, prayerTimes, language, tr, hasAlarm } = params;

  for (const event of EVENTS) {
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
    const body = `${tr.labels?.eventNotifBody} (${tr.prayers?.[event] || event}) (${timeString})`;
    const sound = config.events[event]?.sound;

    // Create event notification
    await notifee.createTriggerNotification(
      {
        id: `prayer-event-${event.toLowerCase()}`,
        title: title,
        body: body,
        data: {
          type: 'prayer-event',
          volume: config.notifSettings.volume,
          sound: sound ?? '',
        },
        android: {
          channelId: `nejonprayer-vib-${config.notifSettings.vibration}`,
          showTimestamp: true,
          smallIcon: 'ic_stat_prayer',
          color: AndroidColor.BLUE,
          pressAction: { id: 'default', launchActivity: 'default' },
          actions: [{ title: 'OK', pressAction: { id: 'OK' } }],
          style: {
            type: AndroidStyle.INBOX,
            lines: [body],
          },
          autoCancel: false,
          ongoing: true,
        },
        ios: {
          categoryId: 'prayer-event-category',
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

    const formatted = triggerTime.toLocaleString('en-GB');
    const offsetInfo = offset !== 0 ? ` (${offset > 0 ? '+' : ''}${offset} min)` : '';
    console.log(`⏰ Scheduled ${tr.prayers?.[event]} at ${formatted}${offsetInfo}`);
  }
}

// ------------------------------------------------------------
// SPECIAL SCHEDULE: Special Notifications (Friday, DailyQuotes, etc.)
// ------------------------------------------------------------
async function scheduleSpecialNotifications(params: ScheduleParams) {
  const { config, prayerTimes, language, tr, hasAlarm } = params;

  // --- Special 1: Friday reminder (1 hour before Dhuhr)
  if (config.specials.Friday?.enabled) {
    const dhuhrTime = prayerTimes?.Dhuhr;

    if (!dhuhrTime) {
      console.warn('[FridayReminder] Dhuhr time not available');
      return;
    }

    // Strict HH:mm validation
    const match = dhuhrTime.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    if (!match) {
      console.warn('[FridayReminder] Invalid Dhuhr format:', dhuhrTime);
      return;
    }

    const hour = Number(match[1]);
    const minute = Number(match[2]);
    const now = new Date();
    const currentDay = now.getDay(); // 0=Sun ... 5=Fri

    // Calculate upcoming Friday ----
    const triggerTime = new Date(now);
    const daysUntilFriday = currentDay === 5 ? 0 : (5 - currentDay + 7) % 7;
    triggerTime.setDate(now.getDate() + daysUntilFriday);
    triggerTime.setHours(hour, minute, 0, 0);

    // Subtract 1 hour safely ----
    triggerTime.setTime(triggerTime.getTime() - 60 * 60 * 1000);
    // Handle "already passed today" case with grace window
    const GRACE_MS = 60 * 1000; // 1 minute tolerance

    if (daysUntilFriday === 0 && triggerTime.getTime() < now.getTime() - GRACE_MS) {
      // Too far in the past → schedule next week
      triggerTime.setDate(triggerTime.getDate() + 7);
    }

    // Prepare notification content
    const title = tr.labels?.fridayTitle || 'Jumu\'ah Reminder';
    const body = tr.labels?.fridayBody || 'Today is Jumu‘ah. Take time for prayer.';

    // Create Friday reminder notification
    await notifee.createTriggerNotification(
      {
        id: `special-friday`,
        title: title,
        body: body,
        data: {
          type: 'special',
        },
        android: {
          channelId: `nejonprayer-vib-${config.notifSettings.vibration}`,
          showTimestamp: true,
          smallIcon: 'ic_stat_prayer',
          color: AndroidColor.GREEN,
          pressAction: { id: 'default', launchActivity: 'default' },
          actions: [{ title: 'OK', pressAction: { id: 'OK' } }],
          style: {
            type: AndroidStyle.INBOX,
            lines: [body],
          },
          autoCancel: false,
          ongoing: true,
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

    console.log(`🕌 Scheduled '${tr.labels.fridayTitle}' at ${triggerTime.toLocaleString('en-GB')}`);
  }

  // --- Special 2: Daily Quote at random times (between 8 AM - 8 PM)
  if (config.specials.DailyQuote?.enabled) {
    // Get quotes for the selected language
    const quotes = QUOTES[language] || QUOTES.en;
    // Shuffle quotes
    const shuffledQuotes = [...quotes].sort(() => Math.random() - 0.5);

    const now = new Date();

    // Start from today if before 8 PM, otherwise start from tomorrow
    const startDayOffset = now.getHours() >= 20 ? 1 : 0;

    let scheduled = 0;

    for (let i = 0; i < shuffledQuotes.length; i++) {
      const quoteDate = new Date(now);
      quoteDate.setDate(now.getDate() + startDayOffset + i);

      // Random time between 8:00 and 20:00
      const randomHour = Math.floor(Math.random() * 12) + 8; // 8-19
      const randomMinute = Math.floor(Math.random() * 60); // 0-59
      quoteDate.setHours(randomHour, randomMinute, 0, 0);

      // Skip if time is in the past
      if (quoteDate <= now) continue;

      // Prepare notification content
      const title = tr.labels?.dailyQuoteTitle || 'Daily Reminder';
      const body = shuffledQuotes[i];

      // Create daily quote notification
      await notifee.createTriggerNotification(
        {
          id: `special-daily-quote-${i}`,
          title: title,
          body: body,
          data: {
            type: 'special',
            quoteIndex: i,
          },
          android: {
            channelId: `nejonprayer-vib-${config.notifSettings.vibration}`,
            showTimestamp: true,
            smallIcon: 'ic_stat_prayer',
            color: AndroidColor.GREEN,
            pressAction: { id: 'default', launchActivity: 'default' },
            actions: [{ title: 'OK', pressAction: { id: 'OK' } }],
            style: {
              type: AndroidStyle.BIGTEXT,
              text: body,
            },
            autoCancel: false,
            ongoing: true,
          },
          ios: {
            categoryId: 'special-category',
            critical: false,
            interruptionLevel: 'active',
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: quoteDate.getTime(),
          alarmManager: hasAlarm,
          repeatFrequency: RepeatFrequency.DAILY,
        }
      );

      scheduled++;
    }

    console.log(`📜 Scheduled ${scheduled} '${tr.labels.dailyQuoteTitle}', one quote per day at random times`);
  }
}

// ------------------------------------------------------------
// EVENT HANDLER: Handle notifee notification event (used for foreground and background)
// ------------------------------------------------------------
export async function handleNotificationEvent(type: EventType, notification: any, pressAction: any, source: string = 'unknown') {
  const ns = await notifee.getNotificationSettings();
  const hasAlarm = ns.android.alarm === AndroidNotificationSetting.ENABLED;
  const prefix = source === 'background' ? '[Background]' : '[Foreground]';

  // Early exit: do not play sound or handle anything if notifications are disabled on device
  if (ns.authorizationStatus !== AuthorizationStatus.AUTHORIZED) {
    console.log(`[${source}] Notifications are disabled on this device. Ignoring notification event.`);
    return;
  }

  // Extract data from notification
  const notifType = notification.data?.type || 'unknown';
  const prayerName = notification.data?.prayerName || 'unknown';
  const reminderTitle = notification.data?.reminderTitle || 'Prayer Reminder';
  const reminderBody = notification.data?.reminderBody || 'It\'s time for prayer';
  const volume = Number(notification.data?.volume ?? 1.0);
  const vibration = notification.data?.vibration ?? 'on';
  const snooze = Number(notification.data?.snooze ?? 5);
  const sound = notification.data?.sound;

  switch (type) {
    case EventType.DELIVERED:
      // Notification was delivered and shown to user
      console.log(`✅ ${prefix} Notification delivered`);

      // Actions based on notification type
      if (notifType == 'prayer' || notifType == 'prayer-event') {
        if (sound) await startSound(sound, volume);
      }
      else if (notifType == 'prayer-reminder') {
        if (sound) await startSound(sound, volume);
      }
      break;

    case EventType.ACTION_PRESS:
      // pressed an action button
      switch (pressAction?.id) {
        case 'dismiss':
          // "Dismiss" button pressed (prayers only)
          console.log(`🔘 ${prefix} Notification "Dismiss" pressed`);
          await cancelDisplayedNotification(notification.id);
          break;

        case 'snooze':
          // "Remind me later" action button pressed (prayers only)
          console.log(`⏰ ${prefix} Notification "Remind me later" pressed. Trigger in (${snooze}min)...`);
          // Create prayer-reminder notification
          await notifee.createTriggerNotification(
            {
              id: `prayer-reminder-for-${prayerName}-${Date.now()}`,
              title: reminderTitle,
              body: reminderBody,
              data: {
                type: 'prayer-reminder',
                volume: String(volume),
                sound: SOUNDS.alarm1, // Default reminder sound
              },
              android: {
                channelId: `nejonprayer-vib-${vibration}`,
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
              timestamp: Date.now() + snooze * 60 * 1000,
              alarmManager: hasAlarm,
            }
          );

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
      // tapped the notification body
      console.log(`👆 ${prefix} Notification pressed`);
      await cancelDisplayedNotification(notification.id);
      break;

    case EventType.DISMISSED:
      // swiped away the notification
      console.log(`👆 ${prefix} Notification dismissed`);
      await cancelDisplayedNotification(notification.id);
      break;
  }
}
