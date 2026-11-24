import AboutScreen from '@/app/extras/about';
import { showFeedbackModal } from '@/components/FeedbackModal';
import { showStoreReviewModal } from '@/components/StoreReviewModal';
import { useLanguageStore } from '@/store/languageStore';
import { useThemeStore } from '@/store/themeStore';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Platform } from 'react-native';

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
jest.mock('@/components/StoreReviewModal', () => ({ showStoreReviewModal: jest.fn() }));
jest.mock('@/components/FeedbackModal', () => ({ showFeedbackModal: jest.fn() }));
// DebugPanel renders under __DEV__ and pulls in native-only modules (in-app updates, notifications)
jest.mock('@/debug/DebugPanel', () => () => null);
jest.mock('react-native-notify-kit', () => ({
  __esModule: true,
  default: {},
}));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { name: 'Nejon Prayer', version: '2.0.0' } },
}));
jest.mock('@react-native-vector-icons/material-design-icons/static', () => {
  const React = require('react');
  return {
    MaterialDesignIcons: ({ name }: { name: string }) =>
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
    rateApp: 'Rate the App', rateAppDesc: 'On Google Play',
    feedback: 'Send Feedback', contactUs: 'Contact Us',
  },
} as any;

beforeEach(() => {
  (Platform as { OS: string }).OS = 'android';
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

  it('shares the website instead of a Play Store link on iOS', async () => {
    (Platform as { OS: string }).OS = 'ios';
    const { Share } = require('react-native');
    Share.share = jest.fn(() => Promise.resolve({ action: 'sharedAction' }));
    render(<AboutScreen />);
    fireEvent.press(screen.getByText('Share App'));
    expect(Share.share).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('nejon.net') }),
      expect.anything()
    );
  });

  it('no longer links to PayPal', () => {
    render(<AboutScreen />);
    expect(screen.queryByText(/PayPal/)).toBeNull();
  });

  it('opens the "Rate the App" modal from About when the rate card is pressed', () => {
    render(<AboutScreen />);
    fireEvent.press(screen.getByText('Rate the App'));
    expect(showStoreReviewModal).toHaveBeenCalledWith(true);
  });

  it('opens the feedback modal at its intro when the feedback card is pressed', () => {
    render(<AboutScreen />);
    fireEvent.press(screen.getByText('Send Feedback'));
    expect(showFeedbackModal).toHaveBeenCalledWith();
  });
});
