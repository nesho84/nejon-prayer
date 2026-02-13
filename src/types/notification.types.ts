export type PrayerType = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';
export type EventPrayerType = 'Imsak' | 'Sunrise';
export type SpecialType = 'Friday' | 'Ramadan' | 'Eid';

export interface NotifSettings {
  volume: number; // 0.0 to 1.0
  vibration: 'on' | 'off';
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
}

export interface SpecialSettings {
  enabled: boolean;
  // Add more fields if needed (e.g., custom times for Ramadan start/end)
}