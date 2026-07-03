import NamaziTableScreen from '@/app/extras/namazi/namazi-table';
import { NAMAZI_TABLE_TR } from '@/constants/translations/namazi-table.tr';
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
jest.mock('expo-navigation-bar', () => ({ NavigationBar: { setStyle: jest.fn() } }));

const mockTheme = {
  bg: '#fff', text: '#111', text2: '#555', textMuted: '#888', placeholder: '#999',
  card: '#f5f5f5', accent: '#007AFF', accent2: '#FF6B00', islamicGreen: '#1a8a00',
  border: '#ccc', borderCard: '#ddd', overlay: 'rgba(0,0,0,0.05)',
} as any;

const mockTr = {
  prayers: { Fajr: 'Fajr', Dhuhr: 'Dhuhr', Asr: 'Asr', Maghrib: 'Maghrib', Isha: 'Isha' },
} as any;

beforeEach(() => {
  useThemeStore.setState({ theme: mockTheme, resolvedTheme: 'light' as any });
  useLanguageStore.setState({ tr: mockTr, language: 'en' as any });
});

describe('NamaziTableScreen', () => {
  const namaziTr = NAMAZI_TABLE_TR.en;

  it('renders the header title and subtitle', () => {
    render(<NamaziTableScreen />);
    expect(screen.getByText(namaziTr.headerTitle)).toBeTruthy();
    expect(screen.getByText(namaziTr.headerSubtitle)).toBeTruthy();
  });

  it('renders every prayer name', () => {
    render(<NamaziTableScreen />);
    ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].forEach((name) =>
      expect(screen.getAllByText(name).length).toBeGreaterThan(0)
    );
  });

  it('renders the rakah column headers', () => {
    render(<NamaziTableScreen />);
    expect(screen.getAllByText(namaziTr.tableSunnetHeader).length).toBeGreaterThan(0); // two Sunnah columns
    expect(screen.getByText(namaziTr.tableFarzHeader)).toBeTruthy();
    expect(screen.getByText(namaziTr.tableVitriHeader)).toBeTruthy();
  });

  it('renders the footer note', () => {
    render(<NamaziTableScreen />);
    expect(screen.getByText(namaziTr.footerText)).toBeTruthy();
  });
});
