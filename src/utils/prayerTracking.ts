import { TRACKABLE_PRAYERS } from '@/types/prayer.types';

// ------------------------------------------------------------
// Returns how many trackable prayers were prayed on a given day
// ------------------------------------------------------------
export const getDayPrayedCount = (
  tracking: Record<string, Partial<Record<string, 'prayed' | null>>>,
  dateKey: string,
): number => {
  const day = tracking[dateKey];
  if (!day) return 0;
  return TRACKABLE_PRAYERS.filter((p) => day[p] === 'prayed').length;
};
