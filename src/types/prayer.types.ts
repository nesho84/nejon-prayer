// Prayer types
export type PrayerName = "Imsak" | "Fajr" | "Sunrise" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";

export interface PrayerTimes {
  Imsak: string;     // "05:55"
  Fajr: string;      // "06:15"
  Sunrise: string;   // "07:30"
  Dhuhr: string;     // "12:30"
  Asr: string;       // "15:45"
  Maghrib: string;   // "18:20"
  Isha: string;      // "19:45"
}

export interface PrayerEntry {
  name: PrayerName;
  time: string;
}

export interface PrayerCountdown {
  hours: string;
  minutes: string;
  seconds: string;
}

// { "2026-03-28": { Fajr: "06:00", ... } }
export type YearlyPrayerTimes = Record<string, PrayerTimes>;

// For dropdown options
export type PrayerTimeEntry = [PrayerName, string];

// All 7 prayer-time entries in chronological day order
export const ALL_PRAYERS: PrayerName[] = ['Imsak', 'Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

// The 5 obligatory prayers (used for tracking, scheduling, countdown)
export const MAIN_PRAYERS: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

// Non-obligatory time markers
export const PRAYER_EVENTS: PrayerName[] = ['Imsak', 'Sunrise'];