import { toDateKey } from '@/utils/dateKey';
import { MAIN_PRAYERS } from '@/types/prayer.types';

// ------------------------------------------------------------
// Resolves the prayer date to use for tracking.
// If prayerDate is today or yesterday, use it; otherwise default to today.
// Handles edge cases where a user marks a prayer as done after midnight.
// ------------------------------------------------------------
export function resolveTrackingDate(prayerDate?: string): string {
  const today = toDateKey();

  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yesterday = toDateKey(d);

  return prayerDate === today || prayerDate === yesterday ? prayerDate : today;
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
