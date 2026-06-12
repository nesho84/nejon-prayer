import { IslamicHolidayType } from "./islamic-holidays.types";

export type PrayerType = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';
export type PrayerEventType = 'Imsak' | 'Sunrise';
export type SpecialType = 'Friday' | IslamicHolidayType | 'DailyQuote';

export interface NotifSettings {
  volume: number; // 0.0 to 1.0
  vibration: string; // 'off' | 'short' | 'medium' | 'long'
  snooze: number; // Minutes
}

export interface PrayerSettings {
  enabled: boolean;
  offset: number; // Minutes before/after prayer time
  sound?: string; // Optional custom sound file name
}

export interface EventSettings {
  enabled: boolean;
  offset: number; // Minutes before/after event time (for Ramadan/Imsak)
  sound?: string; // Optional custom sound file name
}

export interface SpecialSettings {
  enabled: boolean;
  // Add more fields if needed (e.g., custom times for Ramadan start/end)
}
