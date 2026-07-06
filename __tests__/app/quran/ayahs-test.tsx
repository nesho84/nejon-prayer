import AyahsScreen from '@/app/quran/ayahs';
import { APPLE_STORE_URL, GOOGLE_PLAY_URL } from '@/constants/links';
import { useLanguageStore } from '@/store/languageStore';
import { useModalStore } from '@/store/modalStore';
import { useQuranStore } from '@/store/quranStore';
import { useThemeStore } from '@/store/themeStore';
import { shareText } from '@/utils/system';
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
jest.mock('expo-router', () => ({
  router: { navigate: jest.fn(), replace: jest.fn(), back: jest.fn() },
  Stack: { Screen: () => null },
  useLocalSearchParams: jest.fn(() => ({ surahId: '2', surahName: 'Al-Baqarah', readingMode: 'reading' })),
}));
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('@react-native-vector-icons/ionicons/static', () => {
  const React = require('react');
  return { Ionicons: ({ name }: any) => React.createElement('View', { testID: `icon-${name}` }) };
});
jest.mock('@shopify/flash-list', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    FlashList: React.forwardRef(({ data, renderItem, ListFooterComponent }: any, _ref: any) =>
      React.createElement(
        View,
        null,
        data?.map((item: any, i: number) => React.createElement(View, { key: i }, renderItem({ item }))),
        ListFooterComponent ? React.createElement(ListFooterComponent) : null,
      )
    ),
  };
});
jest.mock('@/components/QuranAyahRow', () => {
  const React = require('react');
  const { View } = require('react-native');
  return ({ verse }: any) => React.createElement(View, { testID: `ayah-${verse.id}` });
});
jest.mock('@/components/AppLoading', () => {
  const React = require('react');
  const { ActivityIndicator } = require('react-native');
  return ({ text }: any) => React.createElement(ActivityIndicator, { testID: `loading-${text}` });
});
jest.mock('@/utils/system', () => ({
  shareText: jest.fn(() => Promise.resolve(true)),
}));
jest.mock('@/components/AppError', () => {
  const React = require('react');
  const { View } = require('react-native');
  return ({ message }: any) => React.createElement(View, { testID: `error-${message}` });
});

const mockTheme = {
  bg: '#fff', text: '#111', text2: '#555', textMuted: '#888',
  accent: '#007AFF', gold: '#FFD700', border: '#ccc',
  overlayLight: 'rgba(0,0,0,0.02)', accentLight: '#e0f0ff',
  divider2: '#ddd',
} as any;

const mockTr = {
  labels: {
    loading: 'Loading',
    quranAyahsError: 'Failed to load ayahs',
    nextSurah: 'Next Surah',
    khatamFinish: 'Complete Khatam',
    khatamCompleteTitle: 'Khatam Complete!',
    khatamCompleteMessage: 'Congratulations',
    khatamShareTitle: 'Khatam Complete! 📖',
    khatamShareMessage: 'I have completed a Khatam.',
    khatamShareVia: 'Completed using Nejon Prayer:',
  },
  buttons: { retry: 'Retry' },
} as any;

const mockSurah = {
  id: 2,
  name: 'البقرة',
  transliteration: 'Al-Baqarah',
  verses: [
    { id: 1, text: 'بِسْمِ اللَّهِ', transliteration: 'Bismillah' },
    { id: 2, text: 'الْحَمْدُ لِلَّهِ', transliteration: 'Alhamdu lillah' },
  ],
};

const mockNextSurah = {
  id: 3,
  name: 'آل عمران',
  transliteration: 'Ali Imran',
  verses: [{ id: 1, text: 'بِسْمِ اللَّهِ', transliteration: 'Bismillah' }],
};

const mockLastSurah = {
  id: 114,
  name: 'الناس',
  transliteration: 'An-Nas',
  verses: [{ id: 1, text: 'قُلْ أَعُوذُ', transliteration: 'Qul a\'udhu' }],
};

beforeEach(() => {
  jest.clearAllMocks();
  const { useLocalSearchParams } = require('expo-router');
  useLocalSearchParams.mockImplementation(() => ({ surahId: '2', surahName: 'Al-Baqarah', readingMode: 'reading' }));
  useThemeStore.setState({ theme: mockTheme, resolvedTheme: 'light' as any });
  useLanguageStore.setState({ tr: mockTr, language: 'en' as any });
  useModalStore.setState({ show: jest.fn() } as any);
  useQuranStore.setState({
    surahs: [mockSurah, mockNextSurah],
    isLoadingAyahs: false,
    isQuranReady: false,
    ayahsError: null,
    ayahs: null,
    lastReadSurahId: null,
    lastReadAyahId: null,
    lastKhatamSurahId: null,
    lastKhatamAyahId: null,
    arabicFontSize: 24,
    translationFontSize: 16,
    selectedEditions: {},
    favoriteAyahs: [],
    fetchAyahs: jest.fn(),
    setLastRead: jest.fn(),
    setLastKhatam: jest.fn(),
    completeKhatam: jest.fn(),
    toggleAyahFavorite: jest.fn(),
    isAyahFavorite: jest.fn(() => false),
    // Override getSurahById after clearAllMocks so the plain function is never reset
    getSurahById: (id: number) => {
      if (id === 2) return mockSurah;
      if (id === 3) return mockNextSurah;
      if (id === 114) return mockLastSurah;
      return null;
    },
  } as any);
});

describe('AyahsScreen', () => {
  it('shows loading indicator when ayahs are loading', () => {
    useQuranStore.setState({ isLoadingAyahs: true } as any);
    render(<AyahsScreen />);
    expect(screen.getByTestId('loading-Loading')).toBeTruthy();
  });

  it('shows error state when ayahsError is set', () => {
    useQuranStore.setState({ ayahsError: 'Failed to load ayahs' } as any);
    render(<AyahsScreen />);
    expect(screen.getByTestId('error-Failed to load ayahs')).toBeTruthy();
  });

  it('renders ayah rows from the surah', () => {
    render(<AyahsScreen />);
    expect(screen.getByTestId('ayah-1')).toBeTruthy();
    expect(screen.getByTestId('ayah-2')).toBeTruthy();
  });

  it('renders "Next Surah" footer for non-last surahs', () => {
    render(<AyahsScreen />);
    expect(screen.getByText('Next Surah')).toBeTruthy();
  });
});

describe('AyahsScreen khatam completion', () => {
  beforeEach(() => {
    const { useLocalSearchParams } = require('expo-router');
    useLocalSearchParams.mockImplementation(() => ({ surahId: '114', surahName: 'An-Nas', readingMode: 'khatam' }));
  });

  it('shows celebration modal with Share and OK buttons on Complete Khatam', () => {
    render(<AyahsScreen />);
    fireEvent.press(screen.getByText('Complete Khatam'));

    expect(useQuranStore.getState().completeKhatam).toHaveBeenCalled();
    const show = useModalStore.getState().show as jest.Mock;
    expect(show).toHaveBeenCalledTimes(1);

    const options = show.mock.calls[0][0];
    expect(options.celebrationAnimation).toBe(true);
    expect(options.buttons).toHaveLength(2);
    expect(options.buttons[0].action).toBe('share');
    expect(options.buttons[1].action).toBe('ok');
  });

  it('shares the khatam message with store link and navigates back', async () => {
    render(<AyahsScreen />);
    fireEvent.press(screen.getByText('Complete Khatam'));

    const show = useModalStore.getState().show as jest.Mock;
    const shareButton = show.mock.calls[0][0].buttons[0];
    await shareButton.onPress();

    const storeUrl = Platform.OS === 'ios' ? APPLE_STORE_URL : GOOGLE_PLAY_URL;
    expect(shareText).toHaveBeenCalledWith(
      mockTr.labels.khatamShareTitle,
      `${mockTr.labels.khatamShareMessage}\n\n${mockTr.labels.khatamShareVia}\n${storeUrl}`,
    );
    expect(require('expo-router').router.back).toHaveBeenCalled();
  });
});
