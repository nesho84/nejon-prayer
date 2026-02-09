export interface Coordinates {
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
  location: Coordinates | null;
  fullAddress: string | null;
  timeZone: TimeZone | null;
}