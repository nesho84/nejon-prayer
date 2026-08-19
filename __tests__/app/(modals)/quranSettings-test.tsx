import QuranSettingsScreen from '@/app/(modals)/quranSettings';
import { useLanguageStore } from '@/store/languageStore';
import { useQuranStore } from '@/store/quranStore';
import { useThemeStore } from '@/store/themeStore';
import { getQuranFont } from '@/constants/fonts';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

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
    quranFontTitle: 'Arabic Font',
    quranFontSystem: 'Default',
    quranFontUthmani: 'Uthmani',
    quranFontAmiri: 'Amiri',
  },
  buttons: { cancel: 'Cancel', save: 'Save' },
} as any;

beforeEach(() => {
  useThemeStore.setState({ theme: mockTheme, resolvedTheme: 'light' as any });
  useLanguageStore.setState({ tr: mockTr, language: 'en' as any });
  useQuranStore.setState({
    arabicFontSize: 24,
    translationFontSize: 16,
    quranFontKey: 'system',
    selectedEditions: { en: 'en.sahih' },
    quran: null, // preview falls back to the literal unless a test loads the JSON
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

  it('falls back to a literal basmala when the Quran JSON is unavailable', () => {
    render(<QuranSettingsScreen />);
    expect(screen.getByText('بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ')).toBeTruthy();
  });

  it('previews the real 1:1 verse when the Quran is loaded', () => {
    // the JSON text carries Quranic marks (U+06E1) that shape differently from a
    // hand-typed basmala — previewing a literal would show the wrong glyphs
    useQuranStore.setState({
      quran: [{ id: 1, verses: [{ id: 1, text: 'بِسۡمِ ٱللَّهِ' }] }],
    } as any);

    render(<QuranSettingsScreen />);
    expect(screen.getByText('بِسۡمِ ٱللَّهِ')).toBeTruthy();
    expect(screen.queryByText('بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ')).toBeNull();
  });
});

describe('QuranSettingsScreen — font picker', () => {
  const preview = () => StyleSheet.flatten(screen.getByText('بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ').props.style);

  it('renders a chip for every font', () => {
    render(<QuranSettingsScreen />);
    expect(screen.getByText('Arabic Font:')).toBeTruthy();
    expect(screen.getByText('Default')).toBeTruthy();
    expect(screen.getByText('Uthmani')).toBeTruthy();
    expect(screen.getByText('Amiri')).toBeTruthy();
  });

  it('updates the preview immediately but does not touch the store until Save', () => {
    render(<QuranSettingsScreen />);
    expect(preview().fontFamily).toBeUndefined();

    fireEvent.press(screen.getByText('Amiri'));
    expect(preview().fontFamily).toBe(getQuranFont('amiri').family);
    expect(useQuranStore.getState().quranFontKey).toBe('system');
  });

  it('commits the selected font on Save', () => {
    render(<QuranSettingsScreen />);
    fireEvent.press(screen.getByText('Uthmani'));
    fireEvent.press(screen.getByText('Save'));
    expect(useQuranStore.getState().quranFontKey).toBe('uthmani');
  });

  it('scales the preview size with the selected font', () => {
    render(<QuranSettingsScreen />);
    fireEvent.press(screen.getByText('Amiri'));
    const amiri = getQuranFont('amiri');
    expect(preview().fontSize).toBeCloseTo(24 * amiri.sizeScale);
    expect(preview().lineHeight).toBeCloseTo(24 * amiri.sizeScale * amiri.lineHeightRatio);
  });
});
