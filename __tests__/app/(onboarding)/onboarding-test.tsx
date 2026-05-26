import OnboardingScreen from '@/app/(onboarding)/onboarding';
import { useLanguageStore } from '@/store/languageStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useThemeStore } from '@/store/themeStore';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
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
jest.mock('react-native-notify-kit', () => ({
  __esModule: true,
  default: {
    requestPermission: jest.fn(() =>
      Promise.resolve({ authorizationStatus: 1 })
    ),
  },
  AuthorizationStatus: { AUTHORIZED: 1, DENIED: 0 },
}));
jest.mock('@/services/locationService', () => ({
  getUserLocation: jest.fn(() => Promise.resolve(null)),
}));
jest.mock('@/components/CustomPicker', () => {
  const React = require('react');
  const { View } = require('react-native');
  return () => React.createElement(View, { testID: 'language-picker' });
});
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return {
    Ionicons: ({ name }: { name: string }) =>
      React.createElement('View', { testID: `icon-${name}` }),
  };
});

const mockTheme = {
  bg: '#fff', text: '#111', text2: '#555', textMuted: '#999',
  primary: '#007AFF', danger: '#FF3B30', divider: '#eee', white: '#fff', card: '#f5f5f5',
} as any;

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => { });
});

afterAll(() => {
  jest.restoreAllMocks();
});

beforeEach(() => {
  useThemeStore.setState({ theme: mockTheme, resolvedTheme: 'light' as any });
  useLanguageStore.setState({ language: 'en' as any });
  useOnboardingStore.setState({ onboardingComplete: false } as any);
  jest.clearAllMocks();
});

describe('OnboardingScreen', () => {
  it('renders step 1 with language picker and Next button', () => {
    render(<OnboardingScreen />);
    expect(screen.getByText('Choose Your Language')).toBeTruthy();
    expect(screen.getByTestId('language-picker')).toBeTruthy();
    expect(screen.getByText('Next')).toBeTruthy();
  });

  it('advances to step 2 when Next is pressed', async () => {
    render(<OnboardingScreen />);
    fireEvent.press(screen.getByText('Next'));
    await waitFor(() => {
      expect(screen.getByText('Enable Location')).toBeTruthy();
      expect(screen.getByText('Allow Location')).toBeTruthy();
    });
  });

  it('advances to step 3 when Allow Location is pressed', async () => {
    render(<OnboardingScreen />);
    fireEvent.press(screen.getByText('Next'));
    await waitFor(() => screen.getByText('Allow Location'));
    fireEvent.press(screen.getByText('Allow Location'));
    await waitFor(() => {
      expect(screen.getByText('Stay Updated')).toBeTruthy();
      expect(screen.getByText('Allow Notifications')).toBeTruthy();
      expect(screen.getByText('Skip')).toBeTruthy();
    });
  });

  it('calls setOnboarding(true) when Skip is pressed on step 3', async () => {
    render(<OnboardingScreen />);
    fireEvent.press(screen.getByText('Next'));
    await waitFor(() => screen.getByText('Allow Location'));
    fireEvent.press(screen.getByText('Allow Location'));
    await waitFor(() => screen.getByText('Skip'));
    fireEvent.press(screen.getByText('Skip'));
    await waitFor(() => {
      expect(useOnboardingStore.getState().onboardingComplete).toBe(true);
    });
  });

  it('calls notifee.requestPermission when Allow Notifications is pressed', async () => {
    const notifee = require('react-native-notify-kit').default;
    render(<OnboardingScreen />);
    fireEvent.press(screen.getByText('Next'));
    await waitFor(() => screen.getByText('Allow Location'));
    fireEvent.press(screen.getByText('Allow Location'));
    await waitFor(() => screen.getByText('Allow Notifications'));
    fireEvent.press(screen.getByText('Allow Notifications'));
    await waitFor(() => {
      expect(notifee.requestPermission).toHaveBeenCalledTimes(1);
    });
  });
});
