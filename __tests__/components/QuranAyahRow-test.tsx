import QuranAyahRow from '@/components/QuranAyahRow';
import { getQuranFont } from '@/constants/fonts';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('@react-native-vector-icons/ionicons/static', () => {
  const React = require('react');
  return { Ionicons: ({ name }: { name: string }) => React.createElement('View', { testID: `icon-${name}` }) };
});
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(() => Promise.resolve()) }));
// system.ts (shareText/copyText) imports react-native-notify-kit directly, native/unavailable in jest.
jest.mock('react-native-notify-kit', () => ({ __esModule: true, default: {} }));

const mockTheme = {
  accentLight: '#e0f0ff', accent: '#007AFF', text2: '#555', text: '#111',
  divider: '#eee', card: '#fff', bg: '#fff',
} as any;

const baseProps = {
  surahId: 2,
  surahName: 'Al-Baqarah',
  verse: { id: 5, text: 'بِسْمِ اللَّهِ', transliteration: 'Bismillah' },
  translation: 'In the name of Allah',
  theme: mockTheme,
  arabicFontSize: 24,
  translationFontSize: 14,
  quranFontKey: 'system' as const,
  isSelected: false,
  isAyahFavorited: false,
  onPress: jest.fn(),
  onToggleAyahFavorite: jest.fn(),
};

describe('QuranAyahRow', () => {
  it('renders Arabic text and translation', () => {
    render(<QuranAyahRow {...baseProps} />);
    expect(screen.getByText('بِسْمِ اللَّهِ')).toBeTruthy();
    expect(screen.getByText('In the name of Allah')).toBeTruthy();
  });

  it('renders ayah number badge', () => {
    render(<QuranAyahRow {...baseProps} />);
    expect(screen.getByText('2:5')).toBeTruthy();
  });

  it('calls Share on share button press', () => {
    const { Share } = require('react-native');
    Share.share = jest.fn(() => Promise.resolve({ action: 'sharedAction' }));
    render(<QuranAyahRow {...baseProps} />);
    fireEvent.press(screen.getByTestId('icon-share-social-outline'));
    expect(Share.share).toHaveBeenCalledTimes(1);
  });

  it('calls copyToClipboard on copy button press', () => {
    const Clipboard = require('expo-clipboard');
    render(<QuranAyahRow {...baseProps} />);
    fireEvent.press(screen.getByTestId('icon-copy-outline'));
    expect(Clipboard.setStringAsync).toHaveBeenCalledTimes(1);
  });

  it('calls onPress when row is pressed', () => {
    const onPress = jest.fn();
    render(<QuranAyahRow {...baseProps} onPress={onPress} />);
    fireEvent.press(screen.getByText('بِسْمِ اللَّهِ'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('QuranAyahRow — Arabic font', () => {
  const arabicStyle = () => StyleSheet.flatten(screen.getByText('بِسْمِ اللَّهِ').props.style);
  const translationStyle = () => StyleSheet.flatten(screen.getByText('In the name of Allah').props.style);

  it('leaves fontFamily unset for the system font', () => {
    render(<QuranAyahRow {...baseProps} quranFontKey="system" />);
    const style = arabicStyle();
    expect(style.fontFamily).toBeUndefined();
    expect(style.fontSize).toBe(24);
    expect(style.lineHeight).toBeCloseTo(24 * 1.85);
  });

  it('applies the family and scaled metrics for a custom font', () => {
    render(<QuranAyahRow {...baseProps} quranFontKey="amiri" />);
    const amiri = getQuranFont('amiri');
    const style = arabicStyle();
    expect(style.fontFamily).toBe(amiri.family);
    expect(style.fontSize).toBeCloseTo(24 * amiri.sizeScale);
    expect(style.lineHeight).toBeCloseTo(24 * amiri.sizeScale * amiri.lineHeightRatio);
  });

  it('never sets includeFontPadding — false clips tashkeel on Android', () => {
    render(<QuranAyahRow {...baseProps} quranFontKey="uthmani" />);
    expect(arabicStyle().includeFontPadding).toBeUndefined();
  });

  it('leaves the translation text untouched in every mode', () => {
    (['system', 'uthmani', 'amiri'] as const).forEach((key) => {
      render(<QuranAyahRow {...baseProps} quranFontKey={key} />);
      const style = translationStyle();
      expect(style.fontFamily).toBeUndefined();
      expect(style.fontSize).toBe(14);
      expect(style.lineHeight).toBeCloseTo(14 * 1.55);
      screen.unmount();
    });
  });
});
