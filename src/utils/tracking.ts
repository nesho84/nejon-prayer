import { MAIN_PRAYERS, PrayerName } from '@/types/prayer.types';
import { toDateKey } from '@/utils/datetime';

// ------------------------------------------------------------
// Date to track a prayer against on the "Prayed" action tap. Uses the tap
// moment + prayer identity, not the notification's frozen date (stale across
// DAILY repeats). Exception: Isha tapped before today's Fajr → previous day.
// ------------------------------------------------------------
export function resolveTrackingDate(prayerName: PrayerName, fajrTime: string | undefined): string {
  const now = new Date();
  const today = toDateKey(now);

  // Before Fajr, the only Isha that can have been prayed is last night's.
  if (prayerName === 'Isha' && fajrTime) {
    const [fh, fm] = fajrTime.split(':').map(Number);
    const beforeFajr = now.getHours() * 60 + now.getMinutes() < fh * 60 + fm;
    if (beforeFajr) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return toDateKey(yesterday);
    }
  }

  return today;
}

// ------------------------------------------------------------
// Returns how many trackable prayers were prayed on a given day
// ------------------------------------------------------------
export const getDayPrayedCount = (
  tracking: Record<string, Partial<Record<string, 'prayed' | null>>>,
  dateKey: string,
): number => {
  const day = tracking[dateKey];
  if (!day) return 0;
  return MAIN_PRAYERS.filter((p) => day[p] === 'prayed').length;
};
