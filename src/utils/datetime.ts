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
// Formats a YYYY-MM-DD date key into a more human-friendly format like "DD.MM.YYYY"
// ------------------------------------------------------------
export const formatDateKey = (dateKey: string): string => {
  const [y, m, d] = dateKey.split('-');
  return `${d}.${m}.${y}`;
};

// ------------------------------------------------------------
// Formats a timestamp as a date in the given locale (e.g. "23 November 2026")
// ------------------------------------------------------------
export const formatDate = (time: number, locale: string, options: Intl.DateTimeFormatOptions): string => {
  return new Date(time).toLocaleDateString(locale, options);
};

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
