import { getYearlyPrayerTimes } from '@/services/prayersService';
import { useDeviceSettingsStore } from '@/store/deviceSettingsStore';
import { useLanguageStore } from '@/store/languageStore';
import { useLocationStore } from '@/store/locationStore';
import { usePrayersStore } from '@/store/prayersStore';
import { PrayerTimes, YearlyPrayerTimes } from '@/types/prayer.types';
import { toDateKey } from '@/utils/datetime';

jest.mock('@/store/storage', () => ({
  mmkvStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  init: jest.fn(),
}));

jest.mock('@/services/prayersService', () => ({
  getYearlyPrayerTimes: jest.fn(),
}));

jest.mock('@/services/locationService', () => ({
  getUserLocation: jest.fn(),
  hasLocationChanged: jest.fn(() => false),
}));

jest.mock('@/store/locationStore', () => ({
  useLocationStore: { getState: jest.fn() },
}));

jest.mock('@/store/deviceSettingsStore', () => ({
  useDeviceSettingsStore: { getState: jest.fn() },
}));

jest.mock('@/store/languageStore', () => ({
  useLanguageStore: { getState: jest.fn() },
}));

const mockGetYearly = getYearlyPrayerTimes as jest.Mock;
const mockLocationGetState = (useLocationStore as any).getState as jest.Mock;
const mockDeviceGetState = (useDeviceSettingsStore as any).getState as jest.Mock;
const mockLanguageGetState = (useLanguageStore as any).getState as jest.Mock;

const TODAY = toDateKey();
const YEAR = new Date().getFullYear();

const PRAYER_TIMES: PrayerTimes = {
  Imsak: '04:30', Fajr: '04:50', Sunrise: '06:20',
  Dhuhr: '12:30', Asr: '15:45', Maghrib: '18:20', Isha: '19:45',
};

const YEARLY: YearlyPrayerTimes = { [TODAY]: PRAYER_TIMES };

const TR_MOCK = { labels: { locationSet: 'Set location', noInternet: 'No internet', prayersError: 'Error', locationError: 'Location error' } };

beforeEach(() => {
  jest.clearAllMocks();
  usePrayersStore.setState({
    prayerTimes: null, prayerTimesDate: null, prayersError: null,
    prayersOutdated: false, lastFetchedDate: null, isLoading: false,
    isReady: false, yearlyPrayerTimes: null, fetchedYear: null,
  });
  mockLanguageGetState.mockReturnValue({ tr: TR_MOCK, language: 'en' });
});

describe('prayersStore — loadPrayerTimes', () => {
  it('sets prayersError when location is null', async () => {
    mockLocationGetState.mockReturnValue({ location: null, timeZone: null });
    mockDeviceGetState.mockReturnValue({ internetConnection: true });
    await usePrayersStore.getState().loadPrayerTimes();
    expect(usePrayersStore.getState().prayerTimes).toBeNull();
    expect(usePrayersStore.getState().prayersError).toBe('Set location');
  });

  it('loads from cached yearly data when year matches', async () => {
    mockLocationGetState.mockReturnValue({ location: { latitude: 48.2, longitude: 16.3 }, timeZone: { countryCode: 'AT' } });
    mockDeviceGetState.mockReturnValue({ internetConnection: true });
    usePrayersStore.setState({ yearlyPrayerTimes: YEARLY, fetchedYear: YEAR });
    await usePrayersStore.getState().loadPrayerTimes();
    expect(mockGetYearly).not.toHaveBeenCalled();
    expect(usePrayersStore.getState().prayerTimes).toEqual(PRAYER_TIMES);
  });

  it('fetches yearly data from API when online and no cache', async () => {
    mockLocationGetState.mockReturnValue({ location: { latitude: 48.2, longitude: 16.3 }, timeZone: { countryCode: 'AT' } });
    mockDeviceGetState.mockReturnValue({ internetConnection: true });
    mockGetYearly.mockResolvedValue(YEARLY);
    await usePrayersStore.getState().loadPrayerTimes();
    expect(mockGetYearly).toHaveBeenCalledTimes(1);
    expect(usePrayersStore.getState().prayerTimes).toEqual(PRAYER_TIMES);
    expect(usePrayersStore.getState().fetchedYear).toBe(YEAR);
  });

  it('falls back to stale yearly data when offline', async () => {
    mockLocationGetState.mockReturnValue({ location: { latitude: 48.2, longitude: 16.3 }, timeZone: { countryCode: 'AT' } });
    mockDeviceGetState.mockReturnValue({ internetConnection: false });
    usePrayersStore.setState({ yearlyPrayerTimes: YEARLY, fetchedYear: YEAR - 1 });
    await usePrayersStore.getState().loadPrayerTimes();
    expect(mockGetYearly).not.toHaveBeenCalled();
    expect(usePrayersStore.getState().prayerTimes).toEqual(PRAYER_TIMES);
    expect(usePrayersStore.getState().prayersOutdated).toBe(true);
  });

  it('sets prayersError when offline and no cached data', async () => {
    mockLocationGetState.mockReturnValue({ location: { latitude: 48.2, longitude: 16.3 }, timeZone: { countryCode: 'AT' } });
    mockDeviceGetState.mockReturnValue({ internetConnection: false });
    await usePrayersStore.getState().loadPrayerTimes();
    expect(usePrayersStore.getState().prayerTimes).toBeNull();
    expect(usePrayersStore.getState().prayersError).toBe('No internet');
  });

  it('sets isLoading to false after completion', async () => {
    mockLocationGetState.mockReturnValue({ location: null, timeZone: null });
    mockDeviceGetState.mockReturnValue({ internetConnection: true });
    await usePrayersStore.getState().loadPrayerTimes();
    expect(usePrayersStore.getState().isLoading).toBe(false);
  });
});

describe('prayersStore — getPrayerTimesForDate', () => {
  it('returns prayer times for a stored date key', async () => {
    usePrayersStore.setState({ yearlyPrayerTimes: YEARLY });
    const result = await usePrayersStore.getState().getPrayerTimesForDate(TODAY);
    expect(result).toEqual(PRAYER_TIMES);
  });

  it('returns null when date key is not in yearly data', async () => {
    usePrayersStore.setState({ yearlyPrayerTimes: YEARLY });
    const result = await usePrayersStore.getState().getPrayerTimesForDate('1900-01-01');
    expect(result).toBeNull();
  });

  it('returns null when yearlyPrayerTimes is null', async () => {
    usePrayersStore.setState({ yearlyPrayerTimes: null });
    const result = await usePrayersStore.getState().getPrayerTimesForDate(TODAY);
    expect(result).toBeNull();
  });
});