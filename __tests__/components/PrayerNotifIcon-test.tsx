import PrayerNotifIcon from '@/components/PrayerNotifIcon';
import { useDeviceSettingsStore } from '@/store/deviceSettingsStore';
import { useNotificationsStore } from '@/store/notificationsStore';
import { render } from '@testing-library/react-native';
import React from 'react';

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  init: jest.fn(),
}));
jest.mock('react-native-notify-kit', () => ({
  __esModule: true,
  default: { getNotificationSettings: jest.fn() },
  AndroidNotificationSetting: { ENABLED: 1 },
  AuthorizationStatus: { AUTHORIZED: 1 },
}));
jest.mock('react-native-sound', () => ({
  __esModule: true,
  default: function () { },
})); jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));
jest.mock('expo-location', () => ({
  hasServicesEnabledAsync: jest.fn(() => Promise.resolve(true)),
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
})); jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return {
    MaterialCommunityIcons: ({ name }: { name: string }) =>
      React.createElement('View', { testID: `icon-${name}` }),
  };
});

const baseProps = { prayerName: 'Fajr', size: 24, color: '#123' };

beforeEach(() => {
  useDeviceSettingsStore.setState({ notificationPermission: true } as any);
  useNotificationsStore.setState({
    prayers: { Fajr: { enabled: true, offset: 0 } },
    events: {},
  } as any);
});

describe('PrayerNotifIcon', () => {
  it('renders off icon when notification permission is denied', () => {
    useDeviceSettingsStore.setState({ notificationPermission: false } as any);
    const { getByTestId } = render(<PrayerNotifIcon {...baseProps} />);
    expect(getByTestId('icon-bell-off-outline')).toBeTruthy();
  });

  it('renders bell icon when enabled with no offset', () => {
    const { getByTestId } = render(<PrayerNotifIcon {...baseProps} />);
    expect(getByTestId('icon-bell-outline')).toBeTruthy();
  });

  it('renders bell with badge when offset is set', () => {
    useNotificationsStore.setState({
      prayers: { Fajr: { enabled: true, offset: 5 } },
      events: {},
    } as any);
    const { getByTestId } = render(<PrayerNotifIcon {...baseProps} />);
    expect(getByTestId('icon-bell-cog-outline')).toBeTruthy();
  });
});
