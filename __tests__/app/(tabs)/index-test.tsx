import HomeScreen from '@/app/(tabs)/index';
import { useDeviceSettingsStore } from '@/store/deviceSettingsStore';
import { useLanguageStore } from '@/store/languageStore';
import { useLocationStore } from '@/store/locationStore';
import { useNotificationsStore } from '@/store/notificationsStore';
import { usePrayersStore } from '@/store/prayersStore';
import { useThemeStore } from '@/store/themeStore';
import { render, screen } from '@testing-library/react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('@sentry/react-native', () => ({ captureException: jest.fn(), init: jest.fn() }));
jest.mock('react-native-notify-kit', () => ({
  default: { openNotificationSettings: jest.fn() },
  AndroidNotificationSetting: { ENABLED: 1 },
  AuthorizationStatus: { AUTHORIZED: 1, DENIED: 0 },
}));
jest.mock('react-native-sound', () => {
  function MockSound(_file: any, _bundle: any, _cb: any) { }
  MockSound.MAIN_BUNDLE = 'MAIN_BUNDLE';
  return { __esModule: true, default: MockSound };
});
jest.mock('@/services/soundService', () => ({ startSound: jest.fn(), stopSound: jest.fn() }));
jest.mock('@/services/notificationsService', () => ({ scheduleNotificationsService: jest.fn() }));
jest.mock('@/services/locationService', () => ({ getUserLocation: jest.fn(), hasLocationChanged: jest.fn() }));
jest.mock('@/services/prayersService', () => ({ getYearlyPrayerTimes: jest.fn() }));
jest.mock('expo-updates', () => ({
  checkForUpdateAsync: jest.fn(() => Promise.resolve({ isAvailable: false })),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, null, children);
  },
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-navigation-bar', () => ({ NavigationBar: () => null }));
jest.mock('expo-router', () => ({
  router: { navigate: jest.fn() },
}));
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return {
    Ionicons: ({ name }: any) => React.createElement('View', { testID: `icon-${name}` }),
    MaterialIcons: ({ name }: any) => React.createElement('View', { testID: `icon-${name}` }),
  };
});
jest.mock('@/hooks/useNextPrayer', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    prevPrayer: null,
    currentPrayerName: 'Fajr',
    nextPrayerName: 'Dhuhr',
    afterNextPrayer: 'Asr',
    prayerCountdown: { hours: '01', minutes: '30', seconds: '00' },
    remainingSeconds: 5400,
    totalSeconds: 7200,
  })),
}));
jest.mock('@/components/PrayerCountdownCard', () => () => null);
jest.mock('@/components/PrayerProgressCard', () => () => null);
jest.mock('@/components/PrayersList', () => () => null);
jest.mock('@/components/QuotesCarouselCard', () => () => null);
jest.mock('@/components/HolidaysCard', () => () => null);
jest.mock('@/components/QuranPlaying', () => () => null);
jest.mock('@/components/AppLoading', () => {
  const React = require('react');
  const { ActivityIndicator } = require('react-native');
  return ({ text }: any) => React.createElement(ActivityIndicator, { testID: `loading-${text}` });
});
jest.mock('@/components/AppError', () => {
  const React = require('react');
  const { View } = require('react-native');
  return ({ message }: any) => React.createElement(View, { testID: `error-${message}` });
});

const mockTheme = {
  bg: '#fff', text: '#111', text2: '#555', accent: '#007AFF',
  border: '#ccc', divider2: '#ddd', danger: '#FF3B30',
  overlay: 'rgba(0,0,0,0.05)', overlayLight: 'rgba(0,0,0,0.02)',
} as any;

const mockTr = {
  labels: {
    loading: 'Loading',
    locationSet: 'Please set your location',
    goToSettings: 'Go to Settings',
    prayersError: 'Failed to load prayer times',
    localeDate: 'en-US',
  },
  buttons: { retry: 'Retry' },
} as any;

const mockPrayerTimes = {
  Fajr: '05:00', Sunrise: '06:30', Dhuhr: '12:00',
  Asr: '15:30', Maghrib: '18:00', Isha: '20:00',
};

beforeEach(() => {
  useThemeStore.setState({ theme: mockTheme, resolvedTheme: 'light' as any });
  useLanguageStore.setState({ tr: mockTr, language: 'en' as any });
  useDeviceSettingsStore.setState({
    isReady: true,
    locationPermission: true,
    notificationPermission: true,
  } as any);
  useLocationStore.setState({
    isReady: true,
    location: { latitude: 35, longitude: 51 },
    timeZone: { location: 'Tehran' },
  } as any);
  usePrayersStore.setState({
    isLoading: false,
    prayerTimes: mockPrayerTimes,
    prayerTimesDate: '2024-01-01',
    prayersError: null,
    loadPrayerTimes: jest.fn(),
  } as any);
  useNotificationsStore.setState({ isReady: true } as any);
  jest.clearAllMocks();
});

describe('HomeScreen', () => {
  it('shows loading when device settings not ready', () => {
    useDeviceSettingsStore.setState({ isReady: false } as any);
    render(<HomeScreen />);
    expect(screen.getByTestId('loading-Loading')).toBeTruthy();
  });

  it('shows loading when location not ready', () => {
    useLocationStore.setState({ isReady: false } as any);
    render(<HomeScreen />);
    expect(screen.getByTestId('loading-Loading')).toBeTruthy();
  });

  it('shows location error when no permission and no location', () => {
    useDeviceSettingsStore.setState({ isReady: true, locationPermission: false } as any);
    useLocationStore.setState({ isReady: true, location: null } as any);
    render(<HomeScreen />);
    expect(screen.getByTestId('error-Please set your location')).toBeTruthy();
  });

  it('shows prayer times error when prayerTimes is null', () => {
    usePrayersStore.setState({ prayerTimes: null, prayersError: null } as any);
    render(<HomeScreen />);
    expect(screen.getByTestId('error-Failed to load prayer times')).toBeTruthy();
  });

  it('shows prayer times error message when prayersError is set', () => {
    usePrayersStore.setState({ prayerTimes: null, prayersError: 'Network error' } as any);
    render(<HomeScreen />);
    expect(screen.getByTestId('error-Network error')).toBeTruthy();
  });

  it.only('renders main content with location info when ready', () => {
    console.log('HomeScreen', HomeScreen);
    render(<HomeScreen />);
  });
});
