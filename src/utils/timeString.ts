// ------------------------------------------------------------
// Checks if a given prayer time (in "HH:mm" format) has already passed today
// ------------------------------------------------------------
export const isTimePast = (prayerTime: string): boolean => {
  const [hours, minutes] = prayerTime.split(':').map(Number);
  const now = new Date();
  const prayer = new Date();
  prayer.setHours(hours, minutes, 0, 0);
  return now > prayer;
};

// ------------------------------------------------------------
// Parse time string and calculate next notification trigger time with offset
// timeStringRaw: "HH:mm" format (e.g., "13:45" or "5:30")
// tomorrowTimeStringRaw: tomorrow's actual time — falls back to today's if omitted/null/invalid
// ------------------------------------------------------------
export function getNotificationTriggerTime(
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

  // If time has passed today, schedule for tomorrow
  const now = new Date();
  if (triggerTime <= now) {
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
