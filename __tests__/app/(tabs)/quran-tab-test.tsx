import QuranTabScreen from '@/app/(tabs)/quran-tab';
import { useLanguageStore } from '@/store/languageStore';
import { useQuranStore } from '@/store/quranStore';
import { useThemeStore } from '@/store/themeStore';
import { fireEvent, render, screen } from '@testing-library/react-native';
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
jest.mock('react-native-track-player', () => ({
  __esModule: true,
  default: {
    getActiveTrack: jest.fn(() => Promise.resolve(null)),
    pause: jest.fn(() => Promise.resolve()),
    play: jest.fn(() => Promise.resolve()),
    stop: jest.fn(() => Promise.resolve()),
    reset: jest.fn(() => Promise.resolve()),
    add: jest.fn(() => Promise.resolve()),
    seekTo: jest.fn(() => Promise.resolve()),
  },
  useProgress: jest.fn(() => ({ position: 0, duration: 0, buffered: 0 })),
}));
jest.mock('expo-router', () => ({
  router: { navigate: jest.fn() },
  useFocusEffect: (cb: any) => {
    const React = require('react');
    React.useEffect(cb, []);
  },
}));
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return {
    Ionicons: ({ name }: any) => React.createElement('View', { testID: `icon-${name}` }),
    MaterialCommunityIcons: ({ name }: any) => React.createElement('View', { testID: `icon-${name}` }),
  };
});
jest.mock('@/services/quranService', () => ({
  AUDIO_EDITIONS: { alafasy: 'Mishary Alafasy' },
  QURAN_TEXT_EDITIONS: {
    en: { sahih: 'en.sahih', ahmedali: 'en.ahmedali' },
    de: { bubenheim: 'de.bubenheim' },
    fr: { hamidullah: 'fr.hamidullah' },
    sq: { ahmeti: 'sq.ahmeti' },
    bs: { korkut: 'bs.korkut' },
    mk: { sahih: 'mk.sahih' },
    tr: { diyanet: 'tr.diyanet' },
  },
  getSurahAudioUrl: jest.fn((id: number) => `https://audio.example.com/${id}.mp3`),
}));
jest.mock('@/components/QuranReadingCard', () => () => null);
jest.mock('@/components/QuranSurahRow', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return ({ surah }: any) =>
    React.createElement(View, { testID: `surah-${surah.id}` },
      React.createElement(Text, null, surah.transliteration));
});
jest.mock('@/components/AppLoading', () => {
  const React = require('react');
  const { ActivityIndicator } = require('react-native');
  return ({ text }: any) => React.createElement(ActivityIndicator, { testID: `loading-${text}` });
});
jest.mock('@/components/AppError', () => {
  const React = require('react');
  const { View } = require('react-native');
  return ({ message }: any) => React.createElement(View, { testID: `error-${message}` });
});

const mockTheme = {
  bg: '#fff', text: '#111', text2: '#555', textMuted: '#888',
  accent: '#007AFF', gold: '#FFD700', card: '#f5f5f5', primary: '#007AFF',
  divider2: '#ddd', border: '#ccc', overlay: 'rgba(0,0,0,0.05)',
  overlayLight: 'rgba(0,0,0,0.02)', placeholder: '#aaa', danger: '#FF3B30',
} as any;

const mockTr = {
  labels: {
    loading: 'Loading',
    quran: 'Quran',
    quranDesc: 'Read and listen',
    quranSurahsError: 'Failed to load surahs',
    searchPlaceholder: 'Search...',
  },
  buttons: { retry: 'Retry' },
} as any;

const mockSurahs = [
  { id: 1, name: 'الفاتحة', transliteration: 'Al-Fatihah', verses: [], numberOfAyahs: 7 },
  { id: 2, name: 'البقرة', transliteration: 'Al-Baqarah', verses: [], numberOfAyahs: 286 },
  { id: 3, name: 'آل عمران', transliteration: 'Ali Imran', verses: [], numberOfAyahs: 200 },
];

beforeEach(() => {
  useThemeStore.setState({ theme: mockTheme, resolvedTheme: 'light' as any });
  useLanguageStore.setState({ tr: mockTr, language: 'en' as any });
  useQuranStore.setState({
    surahs: mockSurahs,
    isQuranReady: true,
    quranError: null,
    loadFullQuran: jest.fn(),
  } as any);
  jest.clearAllMocks();
});

describe('QuranTabScreen', () => {
  it('shows loading indicator when Quran is not ready', () => {
    useQuranStore.setState({ isQuranReady: false } as any);
    render(<QuranTabScreen />);
    expect(screen.getByTestId('loading-Loading')).toBeTruthy();
  });

  it('shows error state when quranError is set', () => {
    useQuranStore.setState({ quranError: 'Failed to load surahs' } as any);
    render(<QuranTabScreen />);
    expect(screen.getByTestId('error-Failed to load surahs')).toBeTruthy();
  });

  it('renders the Quran title', () => {
    render(<QuranTabScreen />);
    expect(screen.getByText('Quran')).toBeTruthy();
  });

  it('renders surah rows', () => {
    render(<QuranTabScreen />);
    expect(screen.getByTestId('surah-1')).toBeTruthy();
    expect(screen.getByTestId('surah-2')).toBeTruthy();
  });

  it('filters surahs by search query', () => {
    render(<QuranTabScreen />);
    const input = screen.getByPlaceholderText('Search...');
    fireEvent.changeText(input, 'Fatihah');
    expect(screen.getByTestId('surah-1')).toBeTruthy();
    expect(screen.queryByTestId('surah-2')).toBeNull();
  });
});
