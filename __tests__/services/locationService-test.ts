
jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  init: jest.fn(),
}));

import { hasLocationChanged } from '@/services/locationService';
import { LocationData } from '@/types/location.types';

const BASE_TIMEZONE = {
  timezone: 'Europe/Vienna',
  zoneName: 'CET',
  offset: '+01:00',
  city: 'Vienna',
  country: 'Austria',
  countryCode: 'AT',
  location: 'Vienna, Austria',
  offline: false,
};

const BASE_NEW_DATA: LocationData = {
  location: { latitude: 48.2085, longitude: 16.3721 },
  fullAddress: 'Vienna, Austria',
  timeZone: BASE_TIMEZONE,
};

describe('hasLocationChanged', () => {
  it('returns true when storedSettings is null', () => {
    expect(hasLocationChanged(null, BASE_NEW_DATA)).toBe(true);
  });

  it('returns true when storedSettings has no location', () => {
    expect(hasLocationChanged({ fullAddress: 'Vienna, Austria' }, BASE_NEW_DATA)).toBe(true);
  });

  it('returns true when stored coordinates are not numbers', () => {
    const stored = { location: { latitude: 'bad' as unknown as number, longitude: 16.3721 } };
    expect(hasLocationChanged(stored, BASE_NEW_DATA)).toBe(true);
  });

  it('returns false when coordinates, address and timezone are all identical', () => {
    const stored: Partial<LocationData> = {
      location: { latitude: 48.2085, longitude: 16.3721 },
      fullAddress: 'Vienna, Austria',
      timeZone: BASE_TIMEZONE,
    };
    expect(hasLocationChanged(stored, BASE_NEW_DATA)).toBe(false);
  });

  it('returns false when coordinate difference is within 5m threshold', () => {
    const stored: Partial<LocationData> = {
      location: { latitude: 48.20851, longitude: 16.37211 }, // ~1m off
      fullAddress: 'Vienna, Austria',
      timeZone: BASE_TIMEZONE,
    };
    expect(hasLocationChanged(stored, BASE_NEW_DATA)).toBe(false);
  });

  it('returns true when latitude differs beyond threshold', () => {
    const stored: Partial<LocationData> = {
      location: { latitude: 48.2086, longitude: 16.3721 }, // ~7m off
      fullAddress: 'Vienna, Austria',
      timeZone: BASE_TIMEZONE,
    };
    expect(hasLocationChanged(stored, BASE_NEW_DATA)).toBe(true);
  });

  it('returns true when address changed even if coordinates are the same', () => {
    const stored: Partial<LocationData> = {
      location: { latitude: 48.2085, longitude: 16.3721 },
      fullAddress: 'Graz, Austria',
      timeZone: BASE_TIMEZONE,
    };
    expect(hasLocationChanged(stored, BASE_NEW_DATA)).toBe(true);
  });

  it('returns true when timezone changed even if coordinates and address are the same', () => {
    const stored: Partial<LocationData> = {
      location: { latitude: 48.2085, longitude: 16.3721 },
      fullAddress: 'Vienna, Austria',
      timeZone: { ...BASE_TIMEZONE, timezone: 'Europe/Berlin' },
    };
    expect(hasLocationChanged(stored, BASE_NEW_DATA)).toBe(true);
  });

  it('returns true when newData location is null', () => {
    const newData: LocationData = { ...BASE_NEW_DATA, location: null };
    expect(hasLocationChanged(null, newData)).toBe(true);
  });
});