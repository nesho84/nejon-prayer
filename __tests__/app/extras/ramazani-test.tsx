import RamadanScreen from '@/app/extras/ramazani';
import { useLanguageStore } from '@/store/languageStore';
import { useThemeStore } from '@/store/themeStore';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

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
  NavigationBar: () => null,
}));
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(() => Promise.resolve()) }));
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return {
    Feather: ({ name }: { name: string }) =>
      React.createElement('View', { testID: `icon-${name}` }),
  };
});

const mockTheme = {
  bg: '#fff', text: '#111', text2: '#555', placeholder: '#999',
  card: '#f5f5f5', card2: '#ececec', accent: '#007AFF',
  statusbar: '#fff', divider: '#eee', divider2: '#ddd', border: '#ccc',
  success: '#34c759',
} as any;

const mockTr = {
  buttons: { copy: 'Copy', copied: 'Copied', share: 'Share' },
} as any;

beforeEach(() => {
  jest.useFakeTimers();
  useThemeStore.setState({ theme: mockTheme, resolvedTheme: 'light' as any });
  useLanguageStore.setState({ tr: mockTr, language: 'en' as any });
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('RamadanScreen', () => {
  it('renders the header title from translations', () => {
    render(<RamadanScreen />);
    expect(screen.getByText('Ramadan Guidance')).toBeTruthy();
  });

  it('renders all 15 section copy buttons', () => {
    render(<RamadanScreen />);
    const copyButtons = screen.getAllByText('Copy');
    expect(copyButtons).toHaveLength(15);
  });

  it('calls Clipboard.setStringAsync when copy is pressed', async () => {
    const Clipboard = require('expo-clipboard');
    render(<RamadanScreen />);
    await act(async () => {
      fireEvent.press(screen.getAllByText('Copy')[0]);
    });
    expect(Clipboard.setStringAsync).toHaveBeenCalledTimes(1);
  });

  it('calls Share.share when share is pressed', async () => {
    const { Share } = require('react-native');
    Share.share = jest.fn(() => Promise.resolve({ action: Share.sharedAction }));
    render(<RamadanScreen />);
    await act(async () => {
      fireEvent.press(screen.getAllByText('Share')[0]);
    });
    expect(Share.share).toHaveBeenCalledTimes(1);
  });
});
