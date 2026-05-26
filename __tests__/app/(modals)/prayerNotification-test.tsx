import PrayerNotificationScreen from '@/app/(modals)/prayerNotification';
import { useDeviceSettingsStore } from '@/store/deviceSettingsStore';
import { useLanguageStore } from '@/store/languageStore';
import { useNotificationsStore } from '@/store/notificationsStore';
import { useThemeStore } from '@/store/themeStore';
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

// --- Core mocks ---
jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('@sentry/react-native', () => ({ captureException: jest.fn(), init: jest.fn() }));
jest.mock('react-native-notify-kit', () => ({
  default: { openNotificationSettings: jest.fn() },
}));
jest.mock('react-native-sound', () => {
  function MockSound(_file: any, _bundle: any, _cb: any) {
    // Don't invoke cb synchronously — avoids "sound is undefined" in closure
  }
  MockSound.prototype.getDuration = jest.fn(() => 3);
  MockSound.prototype.release = jest.fn();
  MockSound.prototype.play = jest.fn();
  MockSound.prototype.stop = jest.fn();
  MockSound.MAIN_BUNDLE = 'MAIN_BUNDLE';
  return { __esModule: true, default: MockSound };
});
jest.mock('@/services/soundService', () => ({
  startSound: jest.fn(),
  stopSound: jest.fn(),
}));
jest.mock('@/services/notificationsService', () => ({
  scheduleNotificationsService: jest.fn(),
}));
jest.mock('@/services/locationService', () => ({
  getUserLocation: jest.fn(),
  hasLocationChanged: jest.fn(),
}));
jest.mock('@/services/prayersService', () => ({
  getYearlyPrayerTimes: jest.fn(),
}));
jest.mock('@/components/ModalSheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  return React.forwardRef(({ children, footer }: any, _ref: any) =>
    React.createElement(View, null, children, footer)
  );
});
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return {
    Ionicons: ({ name }: any) => React.createElement('View', { testID: `icon-${name}` }),
    MaterialCommunityIcons: ({ name }: any) => React.createElement('View', { testID: `icon-${name}` }),
  };
});
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(() => ({ prayer: 'Fajr' })),
}));

// --- Fixture data ---
const mockTheme = {
  bg: '#fff', bg2: '#f5f5f5', text: '#111', text2: '#555', textMuted: '#888',
  textSecondary: '#666', accent: '#007AFF', card: '#f5f5f5',
  primary: '#007AFF', divider: '#eee', divider2: '#ddd', border: '#ccc',
  overlay: 'rgba(0,0,0,0.05)', overlayLight: 'rgba(0,0,0,0.02)',
  accentLight: 'rgba(0,122,255,0.1)', danger: '#FF3B30', handle: '#ccc',
} as any;

const mockTr = {
  prayers: { Fajr: 'Fajr', Dhuhr: 'Dhuhr', Asr: 'Asr', Maghrib: 'Maghrib', Isha: 'Isha' },
  labels: {
    notificationSettings: 'Notification Settings',
    enableNotification: 'Enable Notification',
    notificationTime: 'Notification Time',
    notificationSound: 'Notification Sound',
    offsetOnTime: 'On time',
    offsetMinutes: 'min before',
    noSound: 'No Sound',
    short: 'Short',
  },
  buttons: { cancel: 'Cancel', save: 'Save' },
} as any;

const DEFAULT_FAJR_SETTINGS = { enabled: true, offset: -15, sound: 'azan1_short.mp3' };

beforeEach(() => {
  useThemeStore.setState({ theme: mockTheme, resolvedTheme: 'light' as any });
  useLanguageStore.setState({ tr: mockTr, language: 'en' as any });
  useDeviceSettingsStore.setState({ notificationPermission: true } as any);
  useNotificationsStore.setState({
    prayers: { Fajr: DEFAULT_FAJR_SETTINGS } as any,
    events: {} as any,
  });
  jest.clearAllMocks();
});

describe('PrayerNotificationScreen', () => {
  it('renders the prayer name and subtitle', () => {
    render(<PrayerNotificationScreen />);
    expect(screen.getByText('Fajr')).toBeTruthy();
    expect(screen.getByText('Notification Settings')).toBeTruthy();
  });

  it('renders the enable notification toggle label', () => {
    render(<PrayerNotificationScreen />);
    expect(screen.getByText('Enable Notification')).toBeTruthy();
  });

  it('renders time offset chips', () => {
    render(<PrayerNotificationScreen />);
    expect(screen.getByText('On time')).toBeTruthy();
  });

  it('renders Save and Cancel buttons', () => {
    render(<PrayerNotificationScreen />);
    expect(screen.getByText('Save')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
  });

  it('toggling the switch changes the enabled state visually', () => {
    render(<PrayerNotificationScreen />);
    const switchEl = screen.UNSAFE_getByType(require('react-native').Switch);
    // Initially enabled (from store: true)
    expect(switchEl.props.value).toBe(true);
    fireEvent(switchEl, 'valueChange', false);
    expect(screen.UNSAFE_getByType(require('react-native').Switch).props.value).toBe(false);
  });

  it('does not call setPrayer when Save is pressed with unchanged values', () => {
    const setPrayerSpy = jest.spyOn(useNotificationsStore.getState(), 'setPrayer');
    jest.spyOn(console, 'log').mockImplementation(() => { });
    render(<PrayerNotificationScreen />);
    fireEvent.press(screen.getByText('Save'));
    expect(setPrayerSpy).not.toHaveBeenCalled();
  });

  it('returns null when no prayer param is provided', () => {
    const { useLocalSearchParams } = require('expo-router');
    useLocalSearchParams.mockReturnValue({ prayer: undefined });
    const { toJSON } = render(<PrayerNotificationScreen />);
    expect(toJSON()).toBeNull();
  });
});
