import SettingsScreen from '@/app/(tabs)/settings';
import { useDeviceSettingsStore } from '@/store/deviceSettingsStore';
import { useLanguageStore } from '@/store/languageStore';
import { useLocationStore } from '@/store/locationStore';
import { useNotificationsStore } from '@/store/notificationsStore';
import { usePrayersStore } from '@/store/prayersStore';
import { useThemeStore } from '@/store/themeStore';
import { render, screen } from '@testing-library/react-native';
import React from 'react';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('@sentry/react-native', () => ({ captureException: jest.fn(), init: jest.fn() }));
jest.mock('react-native-notify-kit', () => ({
  default: {
    requestPermission: jest.fn(() => Promise.resolve({ authorizationStatus: 1 })),
    openNotificationSettings: jest.fn(),
    openBatteryOptimizationSettings: jest.fn(),
    openAlarmPermissionSettings: jest.fn(),
  },
  AuthorizationStatus: { AUTHORIZED: 1, DENIED: 0 },
  AndroidNotificationSetting: { ENABLED: 1 },
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
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium' },
}));
jest.mock('@react-native-community/slider', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { __esModule: true, default: ({ testID }: any) => React.createElement(View, { testID: testID ?? 'slider' }) };
});
jest.mock('@/components/CustomPicker', () => {
  const React = require('react');
  const { View } = require('react-native');
  return (_props: any) => React.createElement(View, { testID: 'custom-picker' });
});
jest.mock('@/components/AppLoading', () => {
  const React = require('react');
  const { ActivityIndicator } = require('react-native');
  return ({ text }: any) => React.createElement(ActivityIndicator, { testID: `loading-${text}` });
});
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, null, children);
  },
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return {
    Ionicons: ({ name }: any) => React.createElement('View', { testID: `icon-${name}` }),
    MaterialCommunityIcons: ({ name }: any) => React.createElement('View', { testID: `icon-${name}` }),
    MaterialIcons: ({ name }: any) => React.createElement('View', { testID: `icon-${name}` }),
  };
});

const mockTheme = {
  bg: '#fff', bg2: '#f5f5f5', text: '#111', text2: '#555', textMuted: '#888',
  accent: '#007AFF', card: '#f5f5f5', primary: '#007AFF', divider: '#eee', divider2: '#ddd',
  border: '#ccc', overlay: 'rgba(0,0,0,0.05)', overlayLight: 'rgba(0,0,0,0.02)',
  placeholder: '#aaa', handle: '#ccc', danger: '#FF3B30',
} as any;

const mockTr = {
  labels: {
    loadingSettings: 'Loading Settings',
    updatingSettings: 'Updating Settings',
    deviceSettingsError: 'Settings Error',
    theme: 'Theme',
    language: 'Language',
    location: 'Location',
    prayerTimesStatus: 'Prayer Times',
    notifications: 'Notifications',
    loading: 'Loading',
    loaded: 'Loaded',
    notLoaded: 'Not Loaded',
    volume: 'Volume',
    vibration: 'Vibration',
    vibrationShort: 'Short',
    vibrationMedium: 'Medium',
    vibrationLong: 'Long',
    vibrationNote: 'Note:',
    remindLater: 'Remind Later',
    fridayReminder: 'Friday Reminder',
    dailyReminders: 'Daily Reminders',
    locationButtonText1: 'Refresh Location',
    locationButtonText2: 'Set Location',
    error: 'Error',
    themeError: 'Theme error',
    languageError: 'Language error',
    notificationsDisabled: 'Disabled',
    notificationsDisabledMessage: 'Please enable',
    notificationError: 'Error',
    volumeError: 'Volume error',
    vibrationError: 'Vibration error',
    specialNotificationError: 'Error',
    snoozeError: 'Snooze error',
  },
  buttons: { cancel: 'Cancel', openSettings: 'Open Settings' },
} as any;

const readyDeviceSettings = {
  isReady: true,
  deviceSettingsError: null,
  locationPermission: true,
  notificationPermission: true,
  batteryOptimization: true,
  alarmPermission: true,
};
const readyLocation = {
  isReady: true,
  location: { latitude: 35, longitude: 51 },
  fullAddress: 'Tehran, Iran',
  timeZone: null,
};
const readyPrayers = {
  isLoading: false,
  prayerTimes: null,
  prayersError: null,
  lastFetchedDate: null,
  prayersOutdated: false,
};
const readyNotifications = {
  isReady: true,
  notifSettings: { volume: 1.0, vibration: 'short', snooze: 5 },
  specials: { Friday: { enabled: false }, DailyQuote: { enabled: false } },
};

beforeEach(() => {
  useThemeStore.setState({ theme: mockTheme, themeMode: 'light' as any, resolvedTheme: 'light' as any });
  useLanguageStore.setState({ tr: mockTr, language: 'en' as any });
  useDeviceSettingsStore.setState(readyDeviceSettings as any);
  useLocationStore.setState(readyLocation as any);
  usePrayersStore.setState(readyPrayers as any);
  useNotificationsStore.setState(readyNotifications as any);
  jest.clearAllMocks();
});

describe('SettingsScreen', () => {
  it('shows loading indicator when device settings are not ready', () => {
    useDeviceSettingsStore.setState({ isReady: false } as any);
    render(<SettingsScreen />);
    expect(screen.getByTestId('loading-Loading Settings')).toBeTruthy();
  });

  it('shows loading indicator when notifications are not ready', () => {
    useNotificationsStore.setState({ isReady: false } as any);
    render(<SettingsScreen />);
    expect(screen.getByTestId('loading-Loading Settings')).toBeTruthy();
  });

  it('shows error message when deviceSettingsError is set', () => {
    useDeviceSettingsStore.setState({ ...readyDeviceSettings, deviceSettingsError: 'Some error' } as any);
    render(<SettingsScreen />);
    expect(screen.getByText('Settings Error')).toBeTruthy();
  });

  it('renders Theme and Language sections in main content', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('Theme')).toBeTruthy();
    expect(screen.getByText('Language')).toBeTruthy();
  });

  it('renders Notifications section', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('Notifications')).toBeTruthy();
  });

  it('renders Location section', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('Location')).toBeTruthy();
  });
});
