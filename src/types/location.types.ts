export interface Cords {
  latitude: number;
  longitude: number;
}

export interface TimeZone {
  timezone: string;
  zoneName: string;
  offset: string;
  city: string;
  country: string;
  location: string;
  offline: boolean;
}

export interface LocationData {
  location: Cords | null;
  fullAddress: string | null;
  timeZone: TimeZone | null;
}