import NamaziGuideScreen from '@/app/extras/namazi/namazi-guide';
import { useLanguageStore } from '@/store/languageStore';
import { useThemeStore } from '@/store/themeStore';
import { fireEvent, render, screen } from '@testing-library/react-native';

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
const mockTheme = {
  bg: '#fff', bg2: '#f0f0f0', text: '#111', text2: '#555', textMuted: '#888',
  placeholder: '#999', card: '#f5f5f5', islamicGreen: '#1a8a00',
  primary: '#007AFF', accent: '#007AFF', accent2: '#FF6B00',
  statusbar: '#fff', divider2: '#ddd', border: '#ccc', borderCard: '#ddd',
  overlay: 'rgba(0,0,0,0.05)', secondary: '#06b6d4',
} as any;

const mockTr = {
  labels: { stepLabel: 'Step' },
  prayers: { Fajr: 'Fajr', Dhuhr: 'Dhuhr', Asr: 'Asr', Maghrib: 'Maghrib', Isha: 'Isha' },
} as any;

beforeEach(() => {
  useThemeStore.setState({ theme: mockTheme, resolvedTheme: 'light' as any });
  useLanguageStore.setState({ tr: mockTr, language: 'en' as any });
});

describe('NamaziGuideScreen', () => {
  it('renders the namazi screen header title', () => {
    render(<NamaziGuideScreen />);
    expect(screen.getByText('How to Pray')).toBeTruthy();
  });

  it('renders all 15 step numbers', () => {
    render(<NamaziGuideScreen />);
    for (let i = 1; i <= 15; i++) {
      expect(screen.getAllByText(String(i)).length).toBeGreaterThan(0);
    }
  });

  it('renders progress indicator at step 1 of 15', () => {
    render(<NamaziGuideScreen />);
    expect(screen.getByText('Step 1 / 15')).toBeTruthy();
  });

  it('renders the footer note', () => {
    render(<NamaziGuideScreen />);
    const { NAMAZI_GUIDE_TR } = require('@/constants/translations/namazi-guide.tr');
    expect(screen.getByText(NAMAZI_GUIDE_TR.en.footerText)).toBeTruthy();
  });

  it('expands surah block when its name is pressed', () => {
    render(<NamaziGuideScreen />);
    const { NAMAZI_SURAHS } = require('@/constants/translations/namazi-guide.tr');
    const subhanekeName = NAMAZI_SURAHS.subhaneke.name;
    // Collapsed by default: down chevron visible
    expect(screen.getAllByText('▼').length).toBeGreaterThan(0);
    // Press to expand
    fireEvent.press(screen.getAllByText(subhanekeName)[0]);
    // At least one block is now expanded: up chevron visible
    expect(screen.getAllByText('▲').length).toBeGreaterThan(0);
  });
});
