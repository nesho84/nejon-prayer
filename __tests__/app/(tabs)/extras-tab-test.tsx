import ExtrasTabScreen from '@/app/(tabs)/extras-tab';
import { useLanguageStore } from '@/store/languageStore';
import { useSupporterStore } from '@/store/supporterStore';
import { useThemeStore } from '@/store/themeStore';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Platform } from 'react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('@/services/billingService', () => ({}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, null, children);
  },
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-router', () => ({ router: { navigate: jest.fn() } }));
jest.mock('react-native-notify-kit', () => ({
  __esModule: true,
  default: {},
}));
jest.mock('@react-native-vector-icons/ionicons/static', () => {
  const React = require('react');
  return {
    Ionicons: ({ name }: { name: string }) =>
      React.createElement('View', { testID: `icon-${name}` }),
  };
});
jest.mock('@react-native-vector-icons/material-design-icons/static', () => {
  const React = require('react');
  return {
    MaterialDesignIcons: ({ name }: { name: string }) =>
      React.createElement('View', { testID: `icon-${name}` }),
  };
});

const mockTheme = {
  bg: '#fff', text: '#111', text2: '#555', accent: '#007AFF',
  card: '#f5f5f5', divider: '#eee', divider2: '#ddd', shadow: '#ccc',
} as any;

const mockTr = {
  labels: {
    abdes: 'Ablution', namaz: 'Prayer', tesbih: 'Beads',
    ramadan: 'Ramadan', about: 'About',
  },
} as any;

beforeEach(() => {
  useThemeStore.setState({ theme: mockTheme, resolvedTheme: 'light' as any });
  useLanguageStore.setState({ tr: mockTr });
  jest.clearAllMocks();
});

describe('ExtrasTabScreen', () => {
  it('renders all feature labels', () => {
    render(<ExtrasTabScreen />);
    expect(screen.getByText('Ablution')).toBeTruthy();
    expect(screen.getByText('Prayer')).toBeTruthy();
    expect(screen.getByText('Beads')).toBeTruthy();
    expect(screen.getByText('Ramadan')).toBeTruthy();
    expect(screen.getByText('About')).toBeTruthy();
  });

  it('renders header title fallback', () => {
    render(<ExtrasTabScreen />);
    expect(screen.getByText('Explore Features')).toBeTruthy();
  });

  it('navigates to correct route when a feature item is pressed', () => {
    const { router } = require('expo-router');
    render(<ExtrasTabScreen />);
    fireEvent.press(screen.getByText('Ablution'));
    expect(router.navigate).toHaveBeenCalledWith('/extras/abdesi');
  });

  it('navigates to tesbih route when Beads is pressed', () => {
    const { router } = require('expo-router');
    render(<ExtrasTabScreen />);
    fireEvent.press(screen.getByText('Beads'));
    expect(router.navigate).toHaveBeenCalledWith('/extras/tesbih');
  });
});

describe('ExtrasTabScreen — support card', () => {
  beforeEach(() => {
    (Platform as { OS: string }).OS = 'android';
    useLanguageStore.setState({ language: 'en' as any });
    useSupporterStore.setState({ isSupporter: false });
  });

  it('invites to support and opens the support screen', () => {
    const { router } = require('expo-router');
    render(<ExtrasTabScreen />);
    expect(screen.getByText('Every feature is free. Supporting removes the ads.')).toBeTruthy();
    fireEvent.press(screen.getByText('Support the app'));
    expect(router.navigate).toHaveBeenCalledWith('/extras/supporter');
    expect(screen.queryByText('Supporter')).toBeNull();
  });

  it('shows the supporter badge and thanks a supporter', () => {
    useSupporterStore.setState({ isSupporter: true });
    render(<ExtrasTabScreen />);
    expect(screen.getByText('Supporter')).toBeTruthy();
    expect(screen.getByText('Ads are off for good. Thank you for backing the app.')).toBeTruthy();
  });

  it('is hidden on iOS for now', () => {
    (Platform as { OS: string }).OS = 'ios';
    render(<ExtrasTabScreen />);
    expect(screen.queryByText('Support the app')).toBeNull();
  });
});
