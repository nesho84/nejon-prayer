import AyahsFavoritesScreen from '@/app/quran/ayahs-fav';
import { useLanguageStore } from '@/store/languageStore';
import { useQuranStore } from '@/store/quranStore';
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
  NavigationBar: { setStyle: jest.fn() },
}));
jest.mock('expo-router', () => ({
  router: { navigate: jest.fn() },
  Stack: { Screen: () => null },
}));
jest.mock('@react-native-vector-icons/ionicons/static', () => {
  const React = require('react');
  return { Ionicons: ({ name }: any) => React.createElement('View', { testID: `icon-${name}` }) };
});
jest.mock('@shopify/flash-list', () => {
  const React = require('react');
  const { FlatList } = require('react-native');
  return {
    FlashList: React.forwardRef((props: any, ref: any) => React.createElement(FlatList, { ...props, ref })),
  };
});
jest.mock('@/components/QuranAyahRow', () => {
  const React = require('react');
  const { View } = require('react-native');
  return ({ verse }: any) => React.createElement(View, { testID: `ayah-${verse.id}` });
});

const mockTheme = {
  bg: '#fff', text: '#111', text2: '#555', textMuted: '#888',
  accent: '#007AFF', gold: '#FFD700', border: '#ccc',
} as any;

const mockTr = {
  labels: {
    ayahsFavorites: 'Favourite Ayahs',
    noAyahsFavorites: 'No favourites yet',
    ayahsFavoritesDesc: 'Add ayahs to your favourites',
  },
} as any;

const mockFavoriteAyah = {
  surahId: 2,
  surahName: 'Al-Baqarah',
  ayahId: 255,
  arabicText: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ',
  translation: 'Allah - there is no deity except Him',
};

beforeEach(() => {
  useThemeStore.setState({ theme: mockTheme, resolvedTheme: 'light' as any });
  useLanguageStore.setState({ tr: mockTr, language: 'en' as any });
  useQuranStore.setState({
    favoriteAyahs: [],
    arabicFontSize: 24,
    translationFontSize: 16,
    toggleAyahFavorite: jest.fn(),
  } as any);
  jest.clearAllMocks();
});

describe('AyahsFavoritesScreen', () => {
  it('shows empty state message when no favourites', () => {
    render(<AyahsFavoritesScreen />);
    expect(screen.getByText('No favourites yet')).toBeTruthy();
  });

  it('shows empty state description when no favourites', () => {
    render(<AyahsFavoritesScreen />);
    expect(screen.getByText('Add ayahs to your favourites')).toBeTruthy();
  });

  it('renders a row for each favourite ayah', () => {
    useQuranStore.setState({ favoriteAyahs: [mockFavoriteAyah] } as any);
    render(<AyahsFavoritesScreen />);
    expect(screen.getByTestId('ayah-255')).toBeTruthy();
  });

  it('hides empty state when favourites exist', () => {
    useQuranStore.setState({ favoriteAyahs: [mockFavoriteAyah] } as any);
    render(<AyahsFavoritesScreen />);
    expect(screen.queryByText('No favourites yet')).toBeNull();
  });
});
