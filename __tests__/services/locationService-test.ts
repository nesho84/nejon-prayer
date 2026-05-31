
jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  init: jest.fn(),
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  hasServicesEnabledAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
  Accuracy: { Highest: 6, Balanced: 3 },
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
}));

jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
  Linking: { openSettings: jest.fn() },
  Platform: { OS: 'ios', select: (obj: Record<string, unknown>) => obj.ios ?? obj.default, Version: 0 },
}));

import { getUserLocation, hasLocationChanged } from '@/services/locationService';
import { LocationData } from '@/types/location.types';
import NetInfo from '@react-native-community/netinfo';
import * as Sentry from '@sentry/react-native';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

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

describe('getUserLocation', () => {
  beforeAll(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => { });
    jest.spyOn(console, 'log').mockImplementation(() => { });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null and shows settings alert when permission is permanently denied', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
      canAskAgain: false,
    });

    const result = await getUserLocation(null);

    expect(result).toBeNull();
    expect(Alert.alert).toHaveBeenCalledWith(
      'Enable Location Access',
      expect.any(String),
      expect.arrayContaining([expect.objectContaining({ text: 'Open Settings' })]),
      expect.anything(),
    );
  });

  it('returns null and shows denied alert when permission is temporarily denied', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
      canAskAgain: true,
    });

    const result = await getUserLocation(null);

    expect(result).toBeNull();
    expect(Alert.alert).toHaveBeenCalledWith('Location Access Needed', expect.any(String));
  });

  it('shows offline warning when device has no internet', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted', canAskAgain: true });
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({ coords: { latitude: 48.2085, longitude: 16.3721 } });
    (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValue(false);

    await getUserLocation(null);

    expect(Alert.alert).toHaveBeenCalledWith('No Internet Connection', expect.any(String));
  });

  it('returns null and shows error alert when coords are missing', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted', canAskAgain: true });
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({ coords: null });

    const result = await getUserLocation(null);

    expect(result).toBeNull();
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to get location.');
  });

  it('retries GPS on first failure and returns data on second success', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock)
      .mockResolvedValueOnce({ status: 'granted', canAskAgain: true })
      .mockResolvedValueOnce({ status: 'granted', canAskAgain: true });
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
    (Location.getCurrentPositionAsync as jest.Mock)
      .mockImplementationOnce(() => { throw new Error('GPS timeout'); })
      .mockResolvedValueOnce({ coords: { latitude: 48.2085, longitude: 16.3721 } });
    (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValue(true);
    (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([{
      city: 'Vienna', country: 'Austria', isoCountryCode: 'AT', region: 'Vienna',
    }]);

    const result = await getUserLocation(null);

    expect(Location.getCurrentPositionAsync).toHaveBeenCalledTimes(2);
    expect(result).not.toBeNull();
    expect(result?.location).toEqual({ latitude: 48.2085, longitude: 16.3721 });
  });

  it('returns null when retry permission is denied after first GPS failure', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock)
      .mockResolvedValueOnce({ status: 'granted', canAskAgain: true })
      .mockResolvedValueOnce({ status: 'denied', canAskAgain: false });
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
    (Location.getCurrentPositionAsync as jest.Mock)
      .mockImplementationOnce(() => { throw new Error('GPS timeout'); });

    const result = await getUserLocation(null);

    expect(result).toBeNull();
    expect(Sentry.captureException).toHaveBeenCalled();
  });

  it('captures exception to Sentry and returns null on unexpected error', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock)
      .mockImplementation(() => { throw new Error('native crash'); });

    const result = await getUserLocation(null);

    expect(result).toBeNull();
    expect(Sentry.captureException).toHaveBeenCalled();
  });

  it('returns LocationData with correct location on success', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted', canAskAgain: true });
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({ coords: { latitude: 48.2085, longitude: 16.3721 } });
    (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValue(true);
    (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([{
      city: 'Vienna', country: 'Austria', isoCountryCode: 'AT', region: 'Vienna',
    }]);

    const result = await getUserLocation(null);

    expect(result).not.toBeNull();
    expect(result?.location).toEqual({ latitude: 48.2085, longitude: 16.3721 });
    expect(result?.fullAddress).toContain('Vienna');
  });
});