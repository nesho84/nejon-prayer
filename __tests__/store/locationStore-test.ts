jest.mock('@/store/storage', () => ({
  mmkvStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

import { useLocationStore } from '@/store/locationStore';
import { Cords, TimeZone } from '@/types/location.types';

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

beforeEach(() => {
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
