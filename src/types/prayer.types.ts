// Prayer types
export type PrayerName = "Imsak" | "Fajr" | "Sunrise" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";

export interface PrayerTimes {
  Imsak?: string;    // "05:55"
  Fajr: string;      // "06:15"
  Sunrise?: string;  // "07:30"
  Dhuhr: string;     // "12:30"
  Asr: string;       // "15:45"
  Maghrib: string;   // "18:20"
  Isha: string;      // "19:45"
}

export interface PrayerCountdown {
  hours: string;
  minutes: string;
  seconds: string;
}

export type YearlyPrayerTimes = Record<string, PrayerTimes>; // { "2026-03-28": { Fajr: "06:00", ... } }

// For dropdown options
export type PrayerTimeEntry = [PrayerName, string];

// For prayer tracking
export const TRACKABLE_PRAYERS: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];