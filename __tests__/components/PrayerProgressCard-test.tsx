import PrayerProgressCard from '@/components/PrayerProgressCard';
import { useLanguageStore } from '@/store/languageStore';
import { usePrayersStore } from '@/store/prayersStore';
import { usePrayersTrackingStore } from '@/store/prayersTrackingStore';
import { useThemeStore } from '@/store/themeStore';
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

jest.mock('@sentry/react-native', () => ({ captureException: jest.fn(), captureMessage: jest.fn(), init: jest.fn() }));
jest.mock('react-native-notify-kit', () => ({
  __esModule: true,
  default: { getNotificationSettings: jest.fn() },
  AndroidNotificationSetting: { ENABLED: 1 },
  AuthorizationStatus: { AUTHORIZED: 1 },
}));
jest.mock('react-native-sound', () => ({ __esModule: true, default: function () { } }));
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));
jest.mock('expo-location', () => ({
  hasServicesEnabledAsync: jest.fn(() => Promise.resolve(true)),
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
}));
jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('expo-router', () => ({ router: { navigate: jest.fn() } }));
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return {
    MaterialCommunityIcons: ({ name }: { name: string }) =>
      React.createElement('View', { testID: `icon-${name}` }),
  };
});

const mockTheme = {
  text2: '#555', accent: '#007AFF', surfaceBg: '#f0f0f0', borderCard: '#ddd',
  overlayLight: '#eee', white: '#fff', textSecondary: '#999', placeholder: '#aaa',
  card: '#f5f5f5', accent2: '#FF6B00', divider: '#eee', danger: '#FF3B30',
  brown: '#A0522D', gray: '#8E8E93', pink: '#FF2D55', green: '#34C759',
};
const mockTr = {
  labels: {
    myProgress: 'My Progress',
    week: 'Week',
    month: 'Month',
    dayNames: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  },
};

beforeEach(() => {
  useThemeStore.setState({ theme: mockTheme as any });
  useLanguageStore.setState({ tr: mockTr as any });
  usePrayersStore.setState({ prayerTimesDate: '2026-05-26' } as any);
  usePrayersTrackingStore.setState({ tracking: {} } as any);
});

describe('PrayerProgressCard', () => {
  it('renders week view by default with header', () => {
    render(<PrayerProgressCard />);
    expect(screen.getByText('My Progress')).toBeTruthy();
    expect(screen.getByText('Week')).toBeTruthy();
    expect(screen.getByText('Month')).toBeTruthy();
  });

  it('renders day name headers', () => {
    render(<PrayerProgressCard />);
    expect(screen.getByText('Su')).toBeTruthy();
    expect(screen.getByText('Mo')).toBeTruthy();
  });

  it('switches to month view on toggle press', () => {
    render(<PrayerProgressCard />);
    fireEvent.press(screen.getByText('Month'));
    // Month view renders multiple rows — still shows day names
    expect(screen.getByText('Su')).toBeTruthy();
  });
});
