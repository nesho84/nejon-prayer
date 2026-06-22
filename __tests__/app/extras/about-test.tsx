import AboutScreen from '@/app/extras/about';
import { useLanguageStore } from '@/store/languageStore';
import { useThemeStore } from '@/store/themeStore';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';

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
jest.mock('expo-navigation-bar', () => ({
  NavigationBar: { setStyle: jest.fn() },
}));
jest.mock('expo-router', () => ({ Stack: { Screen: () => null } }));
jest.mock('react-native-notify-kit', () => ({
  __esModule: true,
  default: {},
}));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { name: 'Nejon Prayer', version: '2.0.0' } },
}));
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return {
    MaterialCommunityIcons: ({ name }: { name: string }) =>
      React.createElement('View', { testID: `icon-${name}` }),
  };
});

const mockTheme = {
  bg: '#fff', text: '#111', text2: '#555', placeholder: '#999',
  primary: '#007AFF', danger: '#FF3B30', divider3: '#eee',
  textSecondary: '#444', textMuted: '#888', linkHover: '#007AFF',
} as any;

const mockTr = {
  labels: {
    about: 'About', shareApp: 'Share App', shareAppDesc: 'Share with friends',
    supportDesc: 'Support us', rateApp: 'Rate the App', rateAppDesc: 'On Google Play',
    contactUs: 'Contact Us',
  },
} as any;

beforeEach(() => {
  useThemeStore.setState({ theme: mockTheme, resolvedTheme: 'light' as any });
  useLanguageStore.setState({ tr: mockTr });
  jest.clearAllMocks();
});

describe('AboutScreen', () => {
  it('renders app name and version from Constants', () => {
    render(<AboutScreen />);
    expect(screen.getByText('Nejon Prayer')).toBeTruthy();
    expect(screen.getByText('Version 2.0.0')).toBeTruthy();
  });

  it('calls Share.share when share card is pressed', async () => {
    const { Share } = require('react-native');
    Share.share = jest.fn(() => Promise.resolve({ action: 'sharedAction' }));
    render(<AboutScreen />);
    fireEvent.press(screen.getByText('Share App'));
    expect(Share.share).toHaveBeenCalledTimes(1);
  });

  it('calls Linking.openURL with PayPal URL when support card is pressed', async () => {
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    render(<AboutScreen />);
    fireEvent.press(screen.getByText('Support us'));
    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining('paypal.me')
      );
    });
  });

  it('calls Linking.openURL with Google Play URL when rate card is pressed', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    render(<AboutScreen />);
    fireEvent.press(screen.getByText('Rate the App'));
    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining('play.google.com')
      );
    });
  });
});
