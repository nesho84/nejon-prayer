import QiblaScreen from '@/app/(tabs)/qibla';
import { useLocationStore } from '@/store/locationStore';
import { useThemeStore } from '@/store/themeStore';
import { render, screen } from '@testing-library/react-native';
import React from 'react';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
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
jest.mock('@/components/QiblaCompass', () => {
  const React = require('react');
  const { View } = require('react-native');
  return ({ loading }: any) =>
    React.createElement(View, { testID: 'qibla-compass', accessibilityLabel: loading ? 'loading' : 'ready' });
});

const mockTheme = { bg: '#fff', primary: '#007AFF', text: '#111' } as any;

beforeEach(() => {
  useThemeStore.setState({ theme: mockTheme, resolvedTheme: 'light' as any });
  useLocationStore.setState({ isReady: false, location: null, timeZone: null } as any);
  jest.clearAllMocks();
});

describe('QiblaScreen', () => {
  it('renders QiblaCompass', () => {
    render(<QiblaScreen />);
    expect(screen.getByTestId('qibla-compass')).toBeTruthy();
  });

  it('passes loading=true when location is not ready', () => {
    render(<QiblaScreen />);
    expect(screen.getByTestId('qibla-compass').props.accessibilityLabel).toBe('loading');
  });

  it('passes loading=false when location is ready', () => {
    useLocationStore.setState({
      isReady: true,
      location: { latitude: 35.6, longitude: 51.3 },
      timeZone: { location: 'Tehran' },
    } as any);
    render(<QiblaScreen />);
    expect(screen.getByTestId('qibla-compass').props.accessibilityLabel).toBe('ready');
  });
});
