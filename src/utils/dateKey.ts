// ------------------------------------------------------------
// Returns a local date key in YYYY-MM-DD format for a given date (defaults to today)
// ------------------------------------------------------------
export const toDateKey = (date?: Date): string => {
  const d = date ?? new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// ------------------------------------------------------------
// Parses a YYYY-MM-DD date key back into a local Date
// Note: new Date('YYYY-MM-DD') parses as UTC midnight and causes off-by-one day
// errors in non-UTC timezones — this constructor always uses local time
// ------------------------------------------------------------
export const keyToDate = (dateKey: string): Date => {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// ------------------------------------------------------------
// Resolves the prayer date to use for tracking
// if the prayerDate from the notification is today or yesterday, use it; otherwise, default to today
// This handles edge cases where a user might mark a prayer as done after midnight,
// but the notification's prayerDate is from the previous day
// ------------------------------------------------------------
export function resolveTrackingDate(prayerDate?: string): string {
  const today = toDateKey();

  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yesterday = toDateKey(d);

  return prayerDate === today || prayerDate === yesterday ? prayerDate : today;
}
