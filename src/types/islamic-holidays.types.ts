
export type IslamicHolidayType = "ramadan_start" | "laylat_qadr" | "eid_fitr" | "eid_adha";

export interface IslamicHoliday {
  type: IslamicHolidayType;
  hijriMonth: number;
  hijriDay: number;
  showFromDays: number;
  reminderDaysBefore: number;
}
// List of Islamic holidays with Hijri dates
export const ISLAMIC_HOLIDAYS: IslamicHoliday[] = [
  { type: "ramadan_start", hijriMonth: 9, hijriDay: 1, showFromDays: 14, reminderDaysBefore: 3 },
  { type: "laylat_qadr", hijriMonth: 9, hijriDay: 27, showFromDays: 7, reminderDaysBefore: 1 },
  { type: "eid_fitr", hijriMonth: 10, hijriDay: 1, showFromDays: 7, reminderDaysBefore: 2 },
  { type: "eid_adha", hijriMonth: 12, hijriDay: 10, showFromDays: 7, reminderDaysBefore: 2 },
];

// { "ramadan_start": "2027-02-08", "eid_fitr": "2027-03-09", ... }
export type IslamicHolidayDates = Record<IslamicHolidayType, string>;

export interface UpcomingIslamicHoliday {
  type: IslamicHolidayType;
  gregorianDate: string;
  daysUntil: number; // always >= 1, never 0
}