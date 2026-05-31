import AbdesiScreen from '@/app/extras/abdesi';
import { useLanguageStore } from '@/store/languageStore';
import { useThemeStore } from '@/store/themeStore';
import { render, screen } from '@testing-library/react-native';

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

const mockTheme = {
  bg: '#fff', text: '#111', text2: '#555', placeholder: '#999',
  card: '#f5f5f5', secondary: '#06b6d4', statusbar: '#fff',
  divider2: '#ddd', border: '#ccc',
} as any;

const mockTr = {
  labels: { stepLabel: 'Step' },
} as any;

beforeEach(() => {
  useThemeStore.setState({ theme: mockTheme, resolvedTheme: 'light' as any });
  useLanguageStore.setState({ tr: mockTr, language: 'en' as any });
});

describe('AbdesiScreen', () => {
  it('renders the header title', () => {
    render(<AbdesiScreen />);
    expect(screen.getByText('Performing Wudu')).toBeTruthy();
  });

  it('renders all 10 step numbers', () => {
    render(<AbdesiScreen />);
    for (let i = 1; i <= 10; i++) {
      expect(screen.getByText(String(i))).toBeTruthy();
    }
  });

  it('renders the progress indicator starting at step 1', () => {
    render(<AbdesiScreen />);
    expect(screen.getByText('Step 1 / 10')).toBeTruthy();
  });

  it('renders first step instruction text', () => {
    render(<AbdesiScreen />);
    expect(
      screen.getByText(/Make your intention.*Bismillah/s)
    ).toBeTruthy();
  });
});
