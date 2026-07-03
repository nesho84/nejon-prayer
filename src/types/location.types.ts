export interface AppLocation {
  latitude: number;
  longitude: number;
}

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
  countryCode: string; // ISO 3166-1 alpha-2, e.g. "AT", "DE", "TR"
  location: string;
  offline: boolean;
}

export interface LocationData {
  location: Cords | null;
  fullAddress: string | null;
  timeZone: TimeZone | null;
}