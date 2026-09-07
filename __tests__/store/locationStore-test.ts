import { formatUserAddress, getTimeZoneInfo } from '@/services/locationService';
import { useLocationStore } from '@/store/locationStore';
import { Cords, TimeZone } from '@/types/location.types';
import * as Location from 'expo-location';

jest.mock('@/store/storage', () => ({
  mmkvStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('@/services/locationService', () => ({
  formatUserAddress: jest.fn(),
  getTimeZoneInfo: jest.fn(),
}));

jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Low: 2 },
}));

const mockFormatAddress = formatUserAddress as jest.Mock;
const mockGetTimeZone = getTimeZoneInfo as jest.Mock;
const mockGetPermissions = Location.getForegroundPermissionsAsync as jest.Mock;
const mockGetLastKnown = Location.getLastKnownPositionAsync as jest.Mock;
const mockGetCurrent = Location.getCurrentPositionAsync as jest.Mock;

// 1° of latitude ≈ 111.2 km, so these straddle the 50 km threshold
const FAR_COORDS: Cords = { latitude: 48.2085 + 0.45, longitude: 16.3721 };   // ≈ 50.0 km
const NEAR_COORDS: Cords = { latitude: 48.2085 + 0.44, longitude: 16.3721 };  // ≈ 48.9 km

const COORDS: Cords = { latitude: 48.2085, longitude: 16.3721 };

const TIMEZONE: TimeZone = {
  timezone: 'Europe/Vienna',
  zoneName: 'CET',
  offset: '+01:00',
  city: 'Vienna',
  country: 'Austria',
  countryCode: 'AT',
  location: 'Vienna, Austria',
  offline: false,
};

const OFFLINE_TIMEZONE: TimeZone = {
  ...TIMEZONE, city: '', country: '', countryCode: '', location: '', offline: true,
};

beforeEach(() => {
  jest.clearAllMocks();
  useLocationStore.setState({
    location: null, fullAddress: null, timeZone: null,
    locationChanged: false, lastLocationCheck: null,
  });
  mockGetPermissions.mockResolvedValue({ status: 'granted' });
  mockGetLastKnown.mockResolvedValue(null);
  mockGetCurrent.mockResolvedValue(null);
});

describe('locationStore — setLocation', () => {
  it('starts with all fields as null', () => {
    const { location, fullAddress, timeZone } = useLocationStore.getState();
    expect(location).toBeNull();
    expect(fullAddress).toBeNull();
    expect(timeZone).toBeNull();
  });

  it('sets location, fullAddress and timeZone', () => {
    useLocationStore.getState().setLocation(COORDS, 'Vienna, Austria', TIMEZONE);
    const state = useLocationStore.getState();
    expect(state.location).toEqual(COORDS);
    expect(state.fullAddress).toBe('Vienna, Austria');
    expect(state.timeZone).toEqual(TIMEZONE);
  });

  it('overwrites previous values', () => {
    useLocationStore.getState().setLocation(COORDS, 'Vienna, Austria', TIMEZONE);
    const newCoords: Cords = { latitude: 52.52, longitude: 13.405 };
    useLocationStore.getState().setLocation(newCoords, 'Berlin, Germany', null);
    const state = useLocationStore.getState();
    expect(state.location).toEqual(newCoords);
    expect(state.fullAddress).toBe('Berlin, Germany');
    expect(state.timeZone).toBeNull();
  });

  it('accepts null for all fields', () => {
    useLocationStore.getState().setLocation(COORDS, 'Vienna, Austria', TIMEZONE);
    useLocationStore.getState().setLocation(null, null, null);
    const state = useLocationStore.getState();
    expect(state.location).toBeNull();
    expect(state.fullAddress).toBeNull();
    expect(state.timeZone).toBeNull();
  });
});

describe('locationStore — refreshAddress', () => {
  it('resolves the address when the stored geocode was offline', async () => {
    useLocationStore.getState().setLocation(COORDS, 'Lat: 48.2085, Lon: 16.3721', OFFLINE_TIMEZONE);
    mockFormatAddress.mockResolvedValue('Stephansplatz, 1010, Vienna, Austria');
    mockGetTimeZone.mockResolvedValue(TIMEZONE);

    await useLocationStore.getState().refreshAddress();

    const state = useLocationStore.getState();
    expect(state.fullAddress).toBe('Stephansplatz, 1010, Vienna, Austria');
    expect(state.timeZone).toEqual(TIMEZONE);
    expect(state.location).toEqual(COORDS);
  });

  it('keeps the coordinates when the geocode fails again', async () => {
    useLocationStore.getState().setLocation(COORDS, 'Lat: 48.2085, Lon: 16.3721', OFFLINE_TIMEZONE);
    mockFormatAddress.mockResolvedValue('Lat: 48.2085, Lon: 16.3721');
    mockGetTimeZone.mockResolvedValue(OFFLINE_TIMEZONE);

    await useLocationStore.getState().refreshAddress();

    expect(useLocationStore.getState().fullAddress).toBe('Lat: 48.2085, Lon: 16.3721');
  });

  it('keeps the stored address when the geocode returns null', async () => {
    useLocationStore.getState().setLocation(COORDS, 'Lat: 48.2085, Lon: 16.3721', OFFLINE_TIMEZONE);
    mockFormatAddress.mockResolvedValue(null);
    mockGetTimeZone.mockResolvedValue(null);

    await useLocationStore.getState().refreshAddress();

    const state = useLocationStore.getState();
    expect(state.fullAddress).toBe('Lat: 48.2085, Lon: 16.3721');
    expect(state.timeZone).toEqual(OFFLINE_TIMEZONE);
  });

  it('does nothing when the stored geocode already succeeded', async () => {
    useLocationStore.getState().setLocation(COORDS, 'Vienna, Austria', TIMEZONE);

    await useLocationStore.getState().refreshAddress();

    expect(mockGetTimeZone).not.toHaveBeenCalled();
    expect(mockFormatAddress).not.toHaveBeenCalled();
  });

  it('does nothing when there is no location', async () => {
    await useLocationStore.getState().refreshAddress();

    expect(mockGetTimeZone).not.toHaveBeenCalled();
    expect(mockFormatAddress).not.toHaveBeenCalled();
  });
});

describe('locationStore — checkLocationChange', () => {
  it('does nothing when there is no saved location', async () => {
    await useLocationStore.getState().checkLocationChange();

    expect(mockGetPermissions).not.toHaveBeenCalled();
    expect(useLocationStore.getState().lastLocationCheck).toBeNull();
  });

  it('does nothing and never requests permission when it is not granted', async () => {
    useLocationStore.getState().setLocation(COORDS, 'Vienna, Austria', TIMEZONE);
    mockGetPermissions.mockResolvedValue({ status: 'denied' });

    await useLocationStore.getState().checkLocationChange();

    const state = useLocationStore.getState();
    expect(state.locationChanged).toBe(false);
    expect(state.lastLocationCheck).toBeNull();
    expect(mockGetLastKnown).not.toHaveBeenCalled();
  });

  it('flags a change past the 50 km threshold', async () => {
    useLocationStore.getState().setLocation(COORDS, 'Vienna, Austria', TIMEZONE);
    mockGetLastKnown.mockResolvedValue({ coords: FAR_COORDS });

    await useLocationStore.getState().checkLocationChange();

    const state = useLocationStore.getState();
    expect(state.locationChanged).toBe(true);
    expect(state.lastLocationCheck).toEqual(expect.any(Number));
  });

  it('does not flag a change just under the threshold', async () => {
    useLocationStore.getState().setLocation(COORDS, 'Vienna, Austria', TIMEZONE);
    mockGetLastKnown.mockResolvedValue({ coords: NEAR_COORDS });

    await useLocationStore.getState().checkLocationChange();

    expect(useLocationStore.getState().locationChanged).toBe(false);
  });

  it('clears the flag once the device is back near the saved location', async () => {
    useLocationStore.getState().setLocation(COORDS, 'Vienna, Austria', TIMEZONE);
    useLocationStore.setState({ locationChanged: true });
    mockGetLastKnown.mockResolvedValue({ coords: COORDS });

    await useLocationStore.getState().checkLocationChange();

    expect(useLocationStore.getState().locationChanged).toBe(false);
  });

  it('falls back to the current position when there is no last known fix', async () => {
    useLocationStore.getState().setLocation(COORDS, 'Vienna, Austria', TIMEZONE);
    mockGetLastKnown.mockResolvedValue(null);
    mockGetCurrent.mockResolvedValue({ coords: FAR_COORDS });

    await useLocationStore.getState().checkLocationChange();

    expect(mockGetCurrent).toHaveBeenCalledTimes(1);
    expect(useLocationStore.getState().locationChanged).toBe(true);
  });

  it('retries on the next call when the probe fails', async () => {
    useLocationStore.getState().setLocation(COORDS, 'Vienna, Austria', TIMEZONE);
    mockGetLastKnown.mockRejectedValue(new Error('GPS unavailable'));

    await useLocationStore.getState().checkLocationChange();

    // No timestamp written, so the throttle does not swallow the next attempt
    expect(useLocationStore.getState().lastLocationCheck).toBeNull();

    mockGetLastKnown.mockResolvedValue({ coords: FAR_COORDS });
    await useLocationStore.getState().checkLocationChange();

    expect(useLocationStore.getState().locationChanged).toBe(true);
  });

  it('skips a second check inside the throttle window', async () => {
    useLocationStore.getState().setLocation(COORDS, 'Vienna, Austria', TIMEZONE);
    mockGetLastKnown.mockResolvedValue({ coords: COORDS });

    await useLocationStore.getState().checkLocationChange();
    await useLocationStore.getState().checkLocationChange();

    expect(mockGetLastKnown).toHaveBeenCalledTimes(1);
  });

  it('clears the warning once the device is back near the saved location', async () => {
    useLocationStore.getState().setLocation(COORDS, 'Vienna, Austria', TIMEZONE);
    mockGetLastKnown.mockResolvedValue({ coords: FAR_COORDS });
    await useLocationStore.getState().checkLocationChange();
    expect(useLocationStore.getState().locationChanged).toBe(true);

    // Back home 20 minutes later, past the throttle
    useLocationStore.setState({ lastLocationCheck: Date.now() - 20 * 60 * 1000 });
    mockGetLastKnown.mockResolvedValue({ coords: COORDS });
    await useLocationStore.getState().checkLocationChange();

    expect(useLocationStore.getState().locationChanged).toBe(false);
  });

  it('does not re-probe while the throttle window is still open', async () => {
    useLocationStore.getState().setLocation(COORDS, 'Vienna, Austria', TIMEZONE);
    mockGetLastKnown.mockResolvedValue({ coords: FAR_COORDS });
    await useLocationStore.getState().checkLocationChange();

    useLocationStore.setState({ lastLocationCheck: Date.now() - 5 * 60 * 1000 });
    mockGetLastKnown.mockClear();
    await useLocationStore.getState().checkLocationChange();

    expect(mockGetLastKnown).not.toHaveBeenCalled();
  });

  it('runs only one check at a time', async () => {
    useLocationStore.getState().setLocation(COORDS, 'Vienna, Austria', TIMEZONE);
    let resolveProbe: (value: unknown) => void = () => { };
    mockGetLastKnown.mockReturnValue(new Promise((resolve) => { resolveProbe = resolve; }));

    const first = useLocationStore.getState().checkLocationChange();
    const second = useLocationStore.getState().checkLocationChange();
    resolveProbe({ coords: FAR_COORDS });
    await Promise.all([first, second]);

    expect(mockGetLastKnown).toHaveBeenCalledTimes(1);
  });

  it('discards the result when the saved location changed while probing', async () => {
    useLocationStore.getState().setLocation(COORDS, 'Vienna, Austria', TIMEZONE);
    let resolveProbe: (value: unknown) => void = () => { };
    mockGetLastKnown.mockReturnValue(new Promise((resolve) => { resolveProbe = resolve; }));

    const pending = useLocationStore.getState().checkLocationChange();
    // Settings saves the new location mid-probe
    useLocationStore.getState().setLocation(FAR_COORDS, 'Berlin, Germany', TIMEZONE);
    resolveProbe({ coords: FAR_COORDS });
    await pending;

    const state = useLocationStore.getState();
    expect(state.locationChanged).toBe(false);
    expect(state.lastLocationCheck).toBeNull();
  });

  it('gives up on a fix that never resolves, and stays usable afterwards', async () => {
    jest.useFakeTimers();
    try {
      useLocationStore.getState().setLocation(COORDS, 'Vienna, Austria', TIMEZONE);
      mockGetLastKnown.mockReturnValue(new Promise(() => { })); // never settles

      const pending = useLocationStore.getState().checkLocationChange();
      await jest.advanceTimersByTimeAsync(10_000);
      await pending;
      expect(useLocationStore.getState().lastLocationCheck).toBeNull();

      // The mutex was released, so the next check still works
      mockGetLastKnown.mockResolvedValue({ coords: FAR_COORDS });
      await useLocationStore.getState().checkLocationChange();
      expect(useLocationStore.getState().locationChanged).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });

  it('never lets the position fix pop an Android accuracy dialog', async () => {
    useLocationStore.getState().setLocation(COORDS, 'Vienna, Austria', TIMEZONE);
    mockGetLastKnown.mockResolvedValue(null);
    mockGetCurrent.mockResolvedValue({ coords: FAR_COORDS });

    await useLocationStore.getState().checkLocationChange();

    expect(mockGetCurrent).toHaveBeenCalledWith(
      expect.objectContaining({ mayShowUserSettingsDialog: false })
    );
  });

  it('checks again once the throttle window has passed', async () => {
    useLocationStore.getState().setLocation(COORDS, 'Vienna, Austria', TIMEZONE);
    mockGetLastKnown.mockResolvedValue({ coords: COORDS });

    await useLocationStore.getState().checkLocationChange();
    useLocationStore.setState({ lastLocationCheck: Date.now() - 20 * 60 * 1000 });
    await useLocationStore.getState().checkLocationChange();

    expect(mockGetLastKnown).toHaveBeenCalledTimes(2);
  });
});

describe('locationStore — resetLocationCheck', () => {
  it('clears the flag and re-arms the throttle', () => {
    useLocationStore.setState({ locationChanged: true, lastLocationCheck: Date.now() });

    useLocationStore.getState().resetLocationCheck();

    const state = useLocationStore.getState();
    expect(state.locationChanged).toBe(false);
    expect(state.lastLocationCheck).toBeNull();
  });
});
