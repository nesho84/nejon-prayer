import QuranSettingsScreen from '@/app/(modals)/quranSettings';
import { useLanguageStore } from '@/store/languageStore';
import { useQuranStore } from '@/store/quranStore';
import { useThemeStore } from '@/store/themeStore';
import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('@/components/ModalSheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  return React.forwardRef(({ children, footer }: any, _ref: any) =>
    React.createElement(View, null, children, footer)
  );
});
jest.mock('@react-native-community/slider', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ testID }: any) => React.createElement(View, { testID: testID ?? 'slider' }),
  };
});

const mockTheme = {
  bg: '#fff', bg2: '#f5f5f5', text: '#111', text2: '#555', textMuted: '#888',
  textSecondary: '#666', accent: '#007AFF', card: '#f5f5f5',
  primary: '#007AFF', divider: '#eee', divider2: '#ddd',
  overlay: 'rgba(0,0,0,0.05)', overlayLight: 'rgba(0,0,0,0.02)',
  handle: '#ccc',
} as any;

const mockTr = {
  labels: {
    quranSettingsTitle: 'Quran Settings',
    quranSettingsSubtitle: 'Customize your reading experience',
    quranFontSizeTitle: 'Font Size',
    quranArabic: 'Arabic',
    quranTranslation: 'Translation',
    quranTranslator: 'Translator',
    quranPreviewTranslation: 'In the name of Allah',
  },
  buttons: { cancel: 'Cancel', save: 'Save' },
} as any;

beforeEach(() => {
  useThemeStore.setState({ theme: mockTheme, resolvedTheme: 'light' as any });
  useLanguageStore.setState({ tr: mockTr, language: 'en' as any });
  useQuranStore.setState({
    arabicFontSize: 24,
    translationFontSize: 16,
    selectedEditions: { en: 'en.sahih' },
  } as any);
  jest.clearAllMocks();
});

describe('QuranSettingsScreen', () => {
  it('renders the settings title', () => {
    render(<QuranSettingsScreen />);
    expect(screen.getByText('Quran Settings')).toBeTruthy();
  });

  it('displays the current arabic and translation font sizes', () => {
    render(<QuranSettingsScreen />);
    expect(screen.getByText('24px')).toBeTruthy();
    expect(screen.getByText('16px')).toBeTruthy();
  });

  it('renders Save and Cancel buttons', () => {
    render(<QuranSettingsScreen />);
    expect(screen.getByText('Save')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
  });

  it('does not update the store when Save is pressed with no changes', () => {
    render(<QuranSettingsScreen />);
    fireEvent.press(screen.getByText('Save'));
    expect(useQuranStore.getState().arabicFontSize).toBe(24);
    expect(useQuranStore.getState().translationFontSize).toBe(16);
  });

  it('renders Arabic preview text', () => {
    render(<QuranSettingsScreen />);
    expect(screen.getByText('بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ')).toBeTruthy();
  });
});
