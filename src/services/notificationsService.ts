import { SOUNDS } from "@/constants/sounds";
// @TODO (iOS): uncomment once assets/sounds-ios/*.caf files exist and IOS_SOUNDS is filled in
// import { getIosSound } from "@/constants/sounds";
import { HOLIDAYS_TR } from "@/constants/translations/holidays.tr";
import { QUOTES_TR } from "@/constants/translations/quotes.tr";
import { getHolidayDate } from "@/services/holidaysService";
import { startSound, stopSound } from "@/services/soundService";
import { HOLIDAY_CONFIG, UPCOMING_HOLIDAYS, YearlyHolidays } from "@/types/holiday.types";
import { Language, Translations } from '@/types/language.types';
import { EventSettings, NotifSettings, PrayerEventType, PrayerSettings, PrayerType, SpecialSettings, SpecialType } from '@/types/notification.types';
import { MAIN_PRAYERS, PRAYER_EVENTS, PrayerTimes } from "@/types/prayer.types";
import { formatDateKey, toDateKey } from '@/utils/datetime';
import * as Sentry from '@sentry/react-native';
import { Platform } from "react-native";
import notifee, {
  AndroidCategory, AndroidColor, AndroidImportance, AndroidNotificationSetting, AndroidStyle, AndroidVisibility, AuthorizationStatus, EventType, RepeatFrequency, TriggerType
} from 'react-native-notify-kit';

interface ScheduleParams {
  prayerTimes: PrayerTimes;
  tomorrowPrayerTimes?: PrayerTimes | null;
  yearlyHolidays?: YearlyHolidays | null;
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

const PRAYERS = MAIN_PRAYERS as PrayerType[];
const EVENTS = PRAYER_EVENTS as PrayerEventType[];

// Android channel ids per vibration setting ('-v2' = pattern changed; channels are immutable)
const VIBRATION_CHANNEL_IDS: Record<string, string> = {
  off: 'nejonprayer-vib-off',
  short: 'nejonprayer-vib-short-v2',
  medium: 'nejonprayer-vib-medium-v2',
  long: 'nejonprayer-vib-long',
  on: 'nejonprayer-vib-on',
};

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

  // Short: quick-quick-long "signature" pulse, recognizable as Nejon-Prayer ≈ 1.1s
  const vibShort = [50, 180, 120, 180, 150, 500];
  // Medium: 6 cycles of [wait 1000ms, buzz 300ms] ≈ 7.8s
  const vibMedium = Array(6).fill([1000, 300]).flat();
  // Long: 21 cycles of [wait 1000ms, buzz 300ms] ≈ 28s
  const vibLong = Array(21).fill([1000, 300]).flat();

  // Default channel config
  const defaults = {
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    lights: true,
    lightColor: AndroidColor.WHITE,
    badge: true,
    bypassDnd: true,
  };

  await notifee.createChannel({
    id: 'nejonprayer-vib-off',
    name: 'Channel with vibration OFF',
    description: 'Nejon-Prayer Channel Without vibration',
    vibration: false,
    vibrationPattern: undefined,
    ...defaults,
  });
  await notifee.createChannel({
    id: 'nejonprayer-vib-short-v2',
    name: 'Channel with vibration SHORT',
    description: 'Nejon-Prayer Channel With short signature vibration pattern',
    vibration: true,
    vibrationPattern: vibShort,
    ...defaults,
  });
  await notifee.createChannel({
    id: 'nejonprayer-vib-medium-v2',
    name: 'Channel with vibration MEDIUM',
    description: 'Nejon-Prayer Channel With medium vibration pattern',
    vibration: true,
    vibrationPattern: vibMedium,
    ...defaults,
  });
  await notifee.createChannel({
    id: 'nejonprayer-vib-long',
    name: 'Channel with vibration LONG',
    description: 'Nejon-Prayer Channel With long vibration pattern',
    vibration: true,
    vibrationPattern: vibLong,
    ...defaults,
  });
  // Legacy channel kept for users who still have 'on' stored in their settings
  await notifee.createChannel({
    id: 'nejonprayer-vib-on',
    name: 'Channel with vibration ON (legacy)',
    description: 'Legacy channel — replaced by vib-long',
    vibration: true,
    vibrationPattern: vibLong,
    ...defaults,
  });
}

// ------------------------------------------------------------
// Get Android channel ID based on vibration setting
// ------------------------------------------------------------
export function getVibrationChannelId(vibration?: string): string {
  return VIBRATION_CHANNEL_IDS[vibration ?? 'short'] ?? VIBRATION_CHANNEL_IDS.short;
}

// ------------------------------------------------------------
// Create notification categories (action buttons): Called in useNotificationsSync
// iOS requires categories to be registered before action buttons can be shown
// ------------------------------------------------------------
export async function createNotificationCategories(tr: Translations) {
  if (Platform.OS !== 'ios') return;

  await notifee.setNotificationCategories([
    {
      id: 'prayer-category',
      actions: [
        { id: 'done', title: tr.actions?.done || '✓ Prayed' },
        { id: 'dismiss', title: tr.actions?.dismiss || 'Dismiss', destructive: true },
        { id: 'snooze', title: tr.actions?.snooze || 'Later' },
      ],
    },
  ]);
}

// ------------------------------------------------------------
// Cancel all scheduled notifications
// ------------------------------------------------------------
export async function cancelAllNotifications() {
  const notifTypes = ['prayer', 'prayer-event', 'special'];
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
    Sentry.captureException(err);
  }
}

// ------------------------------------------------------------
// Cancel displayed notification and stop sound
// ------------------------------------------------------------
async function cancelDisplayedNotification(notificationId: string) {
  try {
    await notifee.cancelDisplayedNotification(notificationId);
    await stopSound();
  } catch (err) {
    console.error('❌ [notificationsService:Cleanup] Failed to clear:', err);
    Sentry.captureException(err);
  }
}

// ------------------------------------------------------------
// Parse time string and calculate next notification trigger time with offset
// timeStringRaw: "HH:mm" format (e.g., "13:45" or "5:30")
// tomorrowTimeStringRaw: tomorrow's actual time — falls back to today's if omitted/null/invalid
// ------------------------------------------------------------
export function getTriggerTime(
  timeStringRaw: string,
  offsetMinutes: number = 0,
  tomorrowTimeStringRaw?: string | null,
): Date | null {
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

  // If the time already passed, or is less than 2 min away, schedule for tomorrow.
  // The buffer prevents duplicates: Fajr fires at 03:45 → the resync runs and today's
  // Fajr is now 03:46 (times shift daily) → without the buffer 03:46 counts as "future",
  // gets scheduled for today, and the same notification fires a second time at 03:46.
  const now = new Date();
  const BUFFER_MS = 120 * 1000; // 2 min
  if (triggerTime.getTime() - now.getTime() <= BUFFER_MS) {
    // Use tomorrow's actual time if provided and valid, otherwise fall back to today's time
    if (tomorrowTimeStringRaw) {
      const tomorrowTimeString = tomorrowTimeStringRaw.replace(/\u00A0/g, ' ').trim();
      const tomorrowMatch = tomorrowTimeString.match(/^(\d{1,2}):(\d{2})$/);
      if (tomorrowMatch) {
        triggerTime.setHours(Number(tomorrowMatch[1]), Number(tomorrowMatch[2]), 0, 0);
        if (offsetMinutes !== 0) {
          triggerTime.setMinutes(triggerTime.getMinutes() + offsetMinutes);
        }
      }
    }
    triggerTime.setDate(triggerTime.getDate() + 1);
  }

  return triggerTime;
}

// ------------------------------------------------------------
// PRAYER SCHEDULE: All Prayer Notifications
// ------------------------------------------------------------
async function schedulePrayerNotifications(params: ScheduleParams) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { config, prayerTimes, tomorrowPrayerTimes, language, tr, hasAlarm } = params;

  for (const prayer of PRAYERS) {
    // Skip disabled prayers
    if (!config.prayers[prayer]?.enabled) continue;

    // Get time string for this prayer
    const timeString = prayerTimes[prayer];
    if (!timeString) continue;

    // Calculate trigger time with offset
    const offset = config.prayers[prayer]?.offset || 0;
    const triggerTime = getTriggerTime(timeString, offset, tomorrowPrayerTimes?.[prayer]);
    if (!triggerTime) continue;

    // Prepare notification content
    const title = `» ${tr.prayers?.[prayer] || prayer} «`;
    const body = `${tr.labels?.prayerNotifBody} (${timeString})`;
    const sound = config.prayers[prayer]?.sound;
    const volume = config.notifSettings.volume;
    const snooze = config.notifSettings.snooze;
    const vibration = config.notifSettings.vibration;

    // Create prayer notification
    await notifee.createTriggerNotification(
      {
        id: `prayer-${prayer.toLowerCase()}`,
        title: title,
        body: body,
        data: {
          type: 'prayer',
          volume: volume,
          sound: sound ?? '',
          vibration: vibration, // for the reminder to choose the right channel
          snooze: snooze, // for the reminder to set the right trigger time
          prayerName: prayer, // ex. "Fajr"
          prayerDate: toDateKey(triggerTime), // diagnostic only; goes stale across DAILY repeats — tracking uses the tap moment (see resolveTrackingDate)
          scheduledFor: triggerTime.toLocaleString('en-GB'), // diagnostic only; same DAILY staleness as prayerDate
          reminderTitle: title,
          reminderBody: tr.labels?.prayerRemindBody || 'Prayer Reminder',
        },
        android: {
          channelId: getVibrationChannelId(vibration),
          category: AndroidCategory.ALARM,
          smallIcon: 'ic_stat_prayer',
          largeIcon: require('../../assets/images/moon-islam.png'),
          color: AndroidColor.OLIVE,
          style: { type: AndroidStyle.INBOX, lines: [body] },
          actions: [
            { title: tr.actions?.done || '✓ Prayed', pressAction: { id: 'done' } },
            { title: tr.actions?.dismiss || 'Dismiss', pressAction: { id: 'dismiss' } },
            { title: tr.actions?.snooze || 'Snooze', pressAction: { id: 'snooze' } },
          ],
          pressAction: { id: 'default', launchActivity: 'default' },
          lightUpScreen: true,
          showTimestamp: true,
          autoCancel: false,
          ongoing: true,
        },
        ios: {
          categoryId: 'prayer-category',
          interruptionLevel: 'active',
          // @TODO (iOS): native sound for background/killed delivery — see getIosSound in constants/sounds.ts
          // sound: getIosSound(sound),
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
    console.log(`⏰ Scheduled ${title} at ${formatted}${offsetInfo}`);
  }
}

// ------------------------------------------------------------
// PRAYER-EVENT SCHEDULE: All Prayer Event Notifications
// ------------------------------------------------------------
async function scheduleEventNotifications(params: ScheduleParams) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { config, prayerTimes, tomorrowPrayerTimes, language, tr, hasAlarm } = params;

  for (const event of EVENTS) {
    // Skip disabled events
    if (!config.events[event]?.enabled) continue;

    // Get time string for this prayer
    const timeString = prayerTimes[event];
    if (!timeString) continue;

    // Calculate trigger time with offset
    const offset = config.events[event]?.offset || 0;
    const triggerTime = getTriggerTime(timeString, offset, tomorrowPrayerTimes?.[event]);
    if (!triggerTime) continue;

    // Prepare notification content
    const title = `» ${tr.prayers?.[event] || event} «`;
    const body = `${tr.labels?.eventNotifBody} (${tr.prayers?.[event] || event}) (${timeString})`;
    const sound = config.events[event]?.sound;
    const volume = config.notifSettings.volume;
    const vibration = config.notifSettings.vibration;

    // Create event notification
    await notifee.createTriggerNotification(
      {
        id: `prayer-event-${event.toLowerCase()}`,
        title: title,
        body: body,
        data: {
          type: 'prayer-event',
          volume: volume,
          sound: sound ?? '',
          scheduledFor: triggerTime.toLocaleString('en-GB'), // diagnostic only; goes stale across DAILY repeats
        },
        android: {
          channelId: getVibrationChannelId(vibration),
          category: AndroidCategory.ALARM,
          smallIcon: 'ic_stat_prayer',
          color: AndroidColor.BLUE,
          style: { type: AndroidStyle.INBOX, lines: [body] },
          pressAction: { id: 'default', launchActivity: 'default' },
          lightUpScreen: true,
          showTimestamp: true,
          autoCancel: false,
          ongoing: true,
        },
        ios: {
          interruptionLevel: 'active',
          // @TODO (iOS): native sound for background/killed delivery — see getIosSound in constants/sounds.ts
          // sound: getIosSound(sound),
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
    console.log(`⏰ Scheduled ${title} at ${formatted}${offsetInfo}`);
  }
}

// ------------------------------------------------------------
// SPECIAL SCHEDULE: Special Notifications (Friday, DailyQuotes, etc.)
// ------------------------------------------------------------
async function scheduleSpecialNotifications(params: ScheduleParams) {
  const { config, prayerTimes, yearlyHolidays, language, tr, hasAlarm } = params;

  // --- Special 1: Friday reminder (1h before Dhuhr, or a fixed fallback time) ---
  if (config.specials.Friday?.enabled) {
    // Fallback reminder time when Dhuhr is unavailable/invalid (keeps Friday independent of prayer data)
    const FALLBACK_HOUR = 11;
    const FALLBACK_MINUTE = 0;

    const dhuhrTime = prayerTimes?.Dhuhr;

    // Strict HH:mm validation
    const match = dhuhrTime?.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);

    // Friday is independent of prayer data — when Dhuhr is missing/invalid, fall back
    // to a fixed pre-Jumu'ah time (11:00) so the reminder never silently fails
    if (!match) {
      console.warn('[notificationsService:FridayReminder] Dhuhr unavailable/invalid, using fallback:', dhuhrTime);
    }

    const hour = match ? Number(match[1]) : FALLBACK_HOUR;
    const minute = match ? Number(match[2]) : FALLBACK_MINUTE;
    const now = new Date();
    const currentDay = now.getDay(); // 0=Sun ... 5=Fri

    // Calculate upcoming Friday ----
    const triggerTime = new Date(now);
    const daysUntilFriday = currentDay === 5 ? 0 : (5 - currentDay + 7) % 7;
    triggerTime.setDate(now.getDate() + daysUntilFriday);
    triggerTime.setHours(hour, minute, 0, 0);

    // Subtract 1 hour only when anchored to a real Dhuhr time ----
    if (match) triggerTime.setTime(triggerTime.getTime() - 60 * 60 * 1000);

    // Handle "already passed today" case with grace window
    const GRACE_MS = 60 * 1000; // 1 minute tolerance
    if (daysUntilFriday === 0 && triggerTime.getTime() < now.getTime() - GRACE_MS) {
      // Too far in the past → schedule next week
      triggerTime.setDate(triggerTime.getDate() + 7);
    }

    // Prepare notification content
    const title = `» ${tr.labels?.fridayTitle || 'Jumu\'ah'} «`;
    const body = tr.labels?.fridayBody || 'Today is Jumu‘ah. Take time for prayer.';
    const vibration = config.notifSettings.vibration === 'off' ? 'off' : 'short';

    // Create Friday reminder notification
    await notifee.createTriggerNotification(
      {
        id: `special-friday`,
        title: title,
        body: body,
        data: {
          type: 'special',
          subType: 'friday-reminder',
          scheduledFor: triggerTime.toLocaleString('en-GB'),
        },
        android: {
          channelId: getVibrationChannelId(vibration),
          smallIcon: 'ic_stat_prayer',
          color: AndroidColor.GREEN,
          style: { type: AndroidStyle.INBOX, lines: [body] },
          pressAction: { id: 'default', launchActivity: 'default' },
          lightUpScreen: true,
          showTimestamp: true,
          autoCancel: false,
          ongoing: true,
        },
        ios: {
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

    console.log(`🕌 Scheduled '${title}' at ${triggerTime.toLocaleString('en-GB')}`);
  }

  // --- Special 2: Islamic Holidays Reminders (Olny 4 Holidays: Most important ones!) ---
  if (config.specials.Holidays?.enabled && yearlyHolidays) {
    // Morning time for holiday reminders (scheduled N days before, at this time)
    const HOLIDAY_HOUR = 9;
    const HOLIDAY_MINUTE = 0;

    // Loop only the surfaced holidays (Ramadan, Laylat al-Qadr, 2 Eids)
    for (const name of UPCOMING_HOLIDAYS) {
      // Display/notification behavior (showFromDays, reminderDaysBefore)
      const holidayConfig = HOLIDAY_CONFIG[name];

      // Localized name + description for this holiday
      const translations = (HOLIDAYS_TR[language] ?? HOLIDAYS_TR.en).holidays[name];
      if (!translations) continue;

      // Next upcoming Gregorian date for this holiday (today or later)
      const gregorianDate = getHolidayDate(yearlyHolidays, name, toDateKey());

      if (!gregorianDate) {
        console.warn(`[notificationsService:HolidayReminder] Gregorian date not available for ${name}`);
        continue;
      }

      // Build trigger date — N days before holiday at HOLIDAY_HOUR ----
      const [y, m, d] = gregorianDate.split("-");
      const triggerTime = new Date(Number(y), Number(m) - 1, Number(d), HOLIDAY_HOUR, HOLIDAY_MINUTE, 0, 0);
      triggerTime.setDate(triggerTime.getDate() - holidayConfig.reminderDaysBefore);

      // Skip if reminder date already passed ----
      if (toDateKey(triggerTime) < toDateKey()) {
        console.warn(`[notificationsService:HolidayReminder] Reminder for ${name} already passed, skipping`);
        continue;
      }

      // Get localized name and description and format date
      const { name: holidayName, description } = translations;
      const formattedDate = formatDateKey(gregorianDate);

      // Prepare notification content
      const title = `» ${holidayName} «`;
      const body = `${description} · ${formattedDate}`;
      const vibration = config.notifSettings.vibration === 'off' ? 'off' : 'short';

      // Create holiday reminder notification
      await notifee.createTriggerNotification(
        {
          id: `special-${name}`,
          title: title,
          body: body,
          data: {
            type: 'special',
            subType: 'islamic-holiday',
            holidayType: name,
            scheduledFor: triggerTime.toLocaleString('en-GB'),
          },
          android: {
            channelId: getVibrationChannelId(vibration),
            smallIcon: 'ic_stat_prayer',
            color: AndroidColor.GREEN,
            style: { type: AndroidStyle.INBOX, lines: [body] },
            pressAction: { id: 'default', launchActivity: 'default' },
            lightUpScreen: true,
            showTimestamp: true,
            autoCancel: false,
            ongoing: true,
          },
          ios: {
            interruptionLevel: 'active',
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: triggerTime.getTime(),
          alarmManager: hasAlarm,
        }
      );

      console.log(`🌙 Scheduled '${title}' at ${triggerTime.toLocaleString('en-GB')}`);
    }
  }

  // --- Special 3: Daily Quote at random times throughout the day ---
  if (config.specials.DailyQuote?.enabled) {
    // Get and Shuffle quotes for variety on each reschedule
    const quotes = QUOTES_TR[language] || QUOTES_TR.en;
    const shuffledQuotes = [...quotes].sort(() => Math.random() - 0.5);

    // Predefined times and shuffle them to avoid same order every day
    const QUOTE_TIMES = [8, 10, 12, 14, 16, 18, 20, 22];
    const shuffledTimes = [...QUOTE_TIMES].sort(() => Math.random() - 0.5);

    const now = new Date();
    const currentHour = now.getHours();

    // Shuffle all quotes but schedule only 7 — rescheduled daily at Fajr anyway
    const DAYS_TO_SCHEDULE = 7;

    let scheduledCount = 0;

    for (let i = 0; i < DAYS_TO_SCHEDULE; i++) {
      const triggerTime = new Date(now);
      triggerTime.setDate(now.getDate() + i);

      let hour;

      if (i === 0) {
        // TODAY: Try shuffled times first (for variety)
        hour = shuffledTimes.find(h => h > currentHour);

        if (!hour) {
          // Fallback: Use fixed array to guarantee a quote
          hour = QUOTE_TIMES.find(h => h > currentHour);
          // After 22:00, skip to tomorrow
          if (!hour) {
            continue;
          }
        }
      } else {
        // FUTURE DAYS: Cycle through shuffled times
        hour = shuffledTimes[scheduledCount % shuffledTimes.length];
      }

      // Date-based ID - ensures idempotency (same date = same ID)
      triggerTime.setHours(hour, 0, 0, 0);
      const dateISO = toDateKey(triggerTime); // "2026-03-20"
      const notificationId = `quote-${dateISO}`;

      // Prepare notification content
      const title = tr.labels?.dailyQuoteTitle || 'Daily Reminder';
      const body = shuffledQuotes[i];
      const vibration = config.notifSettings.vibration === 'off' ? 'off' : 'short';

      // Create daily quote notification
      await notifee.createTriggerNotification(
        {
          id: notificationId,
          title: title,
          body: body,
          data: {
            type: 'special',
            subType: 'daily-quote',
            scheduledFor: triggerTime.toLocaleString('en-GB'),
          },
          android: {
            channelId: getVibrationChannelId(vibration),
            smallIcon: 'ic_stat_prayer',
            color: AndroidColor.GREEN,
            style: { type: AndroidStyle.BIGTEXT, text: body },
            pressAction: { id: 'default', launchActivity: 'default' },
            lightUpScreen: true,
            showTimestamp: true,
            autoCancel: false,
            ongoing: true,
          },
          ios: {
            interruptionLevel: 'active',
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: triggerTime.getTime(),
          alarmManager: hasAlarm,
          // NO repeatFrequency - each quote fires once!
        }
      );

      scheduledCount++;
    }

    console.log(`📜 Scheduled (${scheduledCount}) ${tr.labels?.dailyQuoteTitle}`);
  }
}

// ------------------------------------------------------------
// EVENT HANDLER: Handle notifee notification event (used for foreground and background)
// ------------------------------------------------------------
export async function handleNotificationEvent(
  type: EventType,
  notification: any,
  pressAction: any,
  source: string = 'unknown',
  notifSettings?: NotifSettings
) {
  // Check notification settings and alarm permission (Android)
  const ns = await notifee.getNotificationSettings();
  const hasAlarm = ns.android.alarm === AndroidNotificationSetting.ENABLED;
  const prefix = source === 'background' ? '[notificationsService:Background]' : '[notificationsService:Foreground]';

  // Early exit: do not play sound or handle anything if notifications are disabled on device
  if (ns.authorizationStatus !== AuthorizationStatus.AUTHORIZED) {
    console.log(`[notificationsService:${source}] Notifications are disabled on this device. Ignoring notification event.`);
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
      // Background sync handled in index.ts

      // Actions based on notification type
      // eslint-disable-next-line eqeqeq
      if (notifType == 'prayer' || notifType == 'prayer-event') {
        if (sound) await startSound(sound, volume);
      }
      // prayer-reminder fires minutes after snooze — its data.volume may be stale.
      // Read fresh from notifSettings instead.
      // eslint-disable-next-line eqeqeq
      else if (notifType == 'prayer-reminder') {
        if (sound) await startSound(sound, notifSettings?.volume ?? volume);
      }
      break;

    case EventType.ACTION_PRESS:
      // pressed an action button
      switch (pressAction?.id) {
        case 'done':
          // "✓ Prayed" action button pressed (prayers only)
          console.log(`🕌 ${prefix} Notification "Prayed" pressed`);
          // Background tracking handled in index.ts and foreground in useNotificationsSync
          await cancelDisplayedNotification(notification.id);
          break;

        case 'dismiss':
          // "Dismiss" action button pressed (prayers only)
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
                sound: SOUNDS.alarm1, // Default reminder sound
              },
              android: {
                channelId: getVibrationChannelId(vibration),
                category: AndroidCategory.ALARM,
                smallIcon: 'ic_stat_prayer',
                color: AndroidColor.RED,
                style: { type: AndroidStyle.INBOX, lines: [reminderBody] },
                pressAction: { id: 'default', launchActivity: 'default' },
                lightUpScreen: true,
                showTimestamp: true,
                autoCancel: false,
                ongoing: true,
              },
              ios: {
                interruptionLevel: 'active',
                // @TODO (iOS): native sound for background/killed delivery — see getIosSound in constants/sounds.ts
                // sound: getIosSound(SOUNDS.alarm1),
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
      }
      break;

    case EventType.PRESS:
      // tapped the notification body
      console.log(`👆 ${prefix} Notification pressed`);
      await cancelDisplayedNotification(notification.id);
      break;

    case EventType.DISMISSED:
      // already gone from the tray — cancelling here can only hit a bystander
      console.log(`👆 ${prefix} Notification dismissed`);
      await stopSound();
      break;
  }
}
