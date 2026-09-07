import { formatUserAddress, getTimeZoneInfo } from '@/services/locationService';
import { useLocationStore } from '@/store/locationStore';
import { Cords, TimeZone } from '@/types/location.types';

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

const mockFormatAddress = formatUserAddress as jest.Mock;
const mockGetTimeZone = getTimeZoneInfo as jest.Mock;

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
  useLocationStore.setState({ location: null, fullAddress: null, timeZone: null });
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
