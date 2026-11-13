import HomePlaceholder from '@/components/HomePlaceholder';
import { useDeviceSettingsStore } from '@/store/deviceSettingsStore';
import { useLanguageStore } from '@/store/languageStore';
import { useLocationStore } from '@/store/locationStore';
import { usePrayersStore } from '@/store/prayersStore';
import { useThemeStore } from '@/store/themeStore';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

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
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, null, children);
  },
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-navigation-bar', () => ({ NavigationBar: { setStyle: jest.fn() } }));
jest.mock('expo-router', () => ({ router: { navigate: jest.fn() } }));
jest.mock('react-native-svg', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children }: any) => React.createElement('View', { testID: 'svg' }, children),
    Circle: () => React.createElement('View', { testID: 'circle' }),
  };
});
jest.mock('@react-native-vector-icons/ionicons/static', () => {
  const React = require('react');
  return { Ionicons: ({ name }: any) => React.createElement('View', { testID: `icon-${name}` }) };
});
jest.mock('@react-native-vector-icons/material-design-icons/static', () => {
  const React = require('react');
  return { MaterialDesignIcons: ({ name }: any) => React.createElement('View', { testID: `icon-${name}` }) };
});
jest.mock('@/components/PrayerRow', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ prayerName, prayerTime }: any) => React.createElement(Text, null, `${prayerName} ${prayerTime}`);
});
jest.mock('@/components/PrayerProgressCard', () => () => null);
jest.mock('@/components/QuotesCarouselCard', () => () => null);
jest.mock('@/components/HolidaysCard', () => () => null);
jest.mock('@/components/QuranPlaying', () => () => null);

const mockTheme = {
  bg: '#fff', text: '#111', text2: '#555', textMuted: '#777', textSecondary: '#666',
  accent: '#007AFF', accent2: '#b26a00', border: '#ccc', divider2: '#ddd', warning: '#facc15',
  placeholder: '#999', card: '#fff', success: '#0a0', danger: '#f00',
} as any;

const mockTr = {
  labels: {
    localeDate: 'en-US',
    locationUnknown: 'No location',
    prayersError: 'Failed to load prayer times',
    prayersNotDownloaded: 'Prayer times not downloaded',
    turnOnLocationInternet: 'Turn on location and internet',
    chipLocationOn: 'Location on',
    chipLocationOff: 'Location off',
    chipOnline: 'Online',
    chipOffline: 'Offline',
  },
  buttons: { retry: 'Retry' },
} as any;

const mockRetryPrayerTimes = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  useThemeStore.setState({ theme: mockTheme });
  useLanguageStore.setState({ tr: mockTr, language: 'en' as any });
  useDeviceSettingsStore.setState({ internetConnection: false } as any);
  useLocationStore.setState({
    location: { latitude: 35, longitude: 51 },
    fullAddress: 'Lat: 35.0000, Lon: 51.0000',
    timeZone: { location: 'Tehran' },
  } as any);
  usePrayersStore.setState({
    prayerTimes: null,
    prayersError: 'No internet connection',
    retryPrayerTimes: mockRetryPrayerTimes,
  } as any);
});

describe('HomePlaceholder', () => {
  it('lists all 7 prayers with empty times', () => {
    render(<HomePlaceholder />);
    ['Imsak', 'Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].forEach((name) => {
      expect(screen.getByText(`${name} --:--`)).toBeTruthy();
    });
  });

  it('shows the empty countdown ring like the live card', () => {
    render(<HomePlaceholder />);
    // Ring + 2 side times + 7 rows share the same placeholder
    expect(screen.getAllByText(/--:--$/)).toHaveLength(10);
    expect(screen.getByText('» — «')).toBeTruthy();
    expect(screen.getAllByText('—')).toHaveLength(2);
    expect(screen.getAllByTestId('icon-clock-outline')).toHaveLength(3);
  });

  it('opens the prayer timings modal from the date header', () => {
    render(<HomePlaceholder />);
    fireEvent.press(screen.getByText('Tehran'));
    expect(router.navigate).toHaveBeenCalledWith('/(modals)/prayerTimings');
  });

  it('shows the city when a location is set', () => {
    render(<HomePlaceholder />);
    expect(screen.getByText('Tehran')).toBeTruthy();
  });

  it('shows "No location" when no location is set', () => {
    useLocationStore.setState({ location: null, fullAddress: null, timeZone: null } as any);
    render(<HomePlaceholder />);
    expect(screen.getByText('No location')).toBeTruthy();
  });

  it('shows the strip title, the turn-on message and the Location on / Offline chips when offline', () => {
    render(<HomePlaceholder />);
    expect(screen.getByText('Prayer times not downloaded')).toBeTruthy();
    expect(screen.getByText('Turn on location and internet')).toBeTruthy();
    expect(screen.getByText('Location on')).toBeTruthy();
    expect(screen.getByText('Offline')).toBeTruthy();
  });

  it('shows the Location off / Online chips without a location', () => {
    useDeviceSettingsStore.setState({ internetConnection: true } as any);
    useLocationStore.setState({ location: null, fullAddress: null, timeZone: null } as any);
    render(<HomePlaceholder />);
    expect(screen.getByText('Location off')).toBeTruthy();
    expect(screen.getByText('Online')).toBeTruthy();
    expect(screen.getByText('Turn on location and internet')).toBeTruthy();
  });

  it('shows the real error when location and internet are both available, falling back to the generic one', () => {
    useDeviceSettingsStore.setState({ internetConnection: true } as any);
    usePrayersStore.setState({ prayersError: 'Server error' } as any);
    const { unmount } = render(<HomePlaceholder />);
    expect(screen.getByText('Server error')).toBeTruthy();
    unmount();

    usePrayersStore.setState({ prayersError: null } as any);
    render(<HomePlaceholder />);
    expect(screen.getByText('Failed to load prayer times')).toBeTruthy();
  });

  it('calls retryPrayerTimes from the Retry button', () => {
    render(<HomePlaceholder />);
    fireEvent.press(screen.getByText('Retry'));
    expect(mockRetryPrayerTimes).toHaveBeenCalledTimes(1);
  });
});
