// ============================================================
// Holiday names — ONE type, all 10 holidays
// ============================================================
export type HolidayName =
  | "hijri_new_year"
  | "ashura"
  | "regaib"
  | "isra_miraj"
  | "laylat_baraat"
  | "ramadan_start"
  | "laylat_qadr"
  | "eid_fitr"
  | "arafah"
  | "eid_adha";

// ============================================================
// Shared types
// ============================================================
export type HijriDate = { month: number; day: number };

export type HolidayConfig = { showFromDays: number; reminderDaysBefore: number };

// Normalized once in the service: { ramadan_start: ["2027-02-08", "2028-01-28"], ... }
export type YearlyHolidays = Partial<Record<HolidayName, string[]>>;

// Single holiday occurrence — mirrors PrayerEntry
export interface HolidayEntry {
  name: HolidayName;
  gregorianDate: string; // "YYYY-MM-DD"
}

export interface UpcomingHoliday {
  name: HolidayName;
  gregorianDate: string;
  daysUntil: number; // always >= 1, never 0
}

// ============================================================
// Lists (name arrays, like ALL_PRAYERS / MAIN_PRAYERS)
// ============================================================
export const ALL_HOLIDAYS: HolidayName[] = [
  "hijri_new_year",
  "ashura",
  "regaib",
  "isra_miraj",
  "laylat_baraat",
  "ramadan_start",
  "laylat_qadr",
  "eid_fitr",
  "arafah",
  "eid_adha",
];

// The 4 surfaced on the HomeScreen card + notifications
export const UPCOMING_HOLIDAYS: HolidayName[] = [
  "ramadan_start",
  "laylat_qadr",
  "eid_fitr",
  "eid_adha",
];

// ============================================================
// Data keyed by name — every constant is a COMPLETE Record<HolidayName>
// (like PrayerTimes covers every PrayerName — no Partial, no casts)
// ============================================================

// Hijri date for each holiday
export const HOLIDAY_HIJRI_DATES: Record<HolidayName, HijriDate> = {
  hijri_new_year: { month: 1, day: 1 },
  ashura: { month: 1, day: 10 },
  regaib: { month: 7, day: 1 },
  isra_miraj: { month: 7, day: 27 },
  laylat_baraat: { month: 8, day: 15 },
  ramadan_start: { month: 9, day: 1 },
  laylat_qadr: { month: 9, day: 27 },
  eid_fitr: { month: 10, day: 1 },
  arafah: { month: 12, day: 9 },
  eid_adha: { month: 12, day: 10 },
};

// Display & notification behavior for each holiday
export const HOLIDAY_CONFIG: Record<HolidayName, HolidayConfig> = {
  hijri_new_year: { showFromDays: 3, reminderDaysBefore: 1 },
  ashura: { showFromDays: 3, reminderDaysBefore: 1 },
  regaib: { showFromDays: 3, reminderDaysBefore: 1 },
  isra_miraj: { showFromDays: 3, reminderDaysBefore: 1 },
  laylat_baraat: { showFromDays: 3, reminderDaysBefore: 1 },
  ramadan_start: { showFromDays: 7, reminderDaysBefore: 3 },
  laylat_qadr: { showFromDays: 3, reminderDaysBefore: 1 },
  eid_fitr: { showFromDays: 7, reminderDaysBefore: 2 },
  arafah: { showFromDays: 3, reminderDaysBefore: 1 },
  eid_adha: { showFromDays: 7, reminderDaysBefore: 2 },
};