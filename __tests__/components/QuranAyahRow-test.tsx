import QuranAyahRow from '@/components/QuranAyahRow';
import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return {
    Ionicons: ({ name }: { name: string }) => React.createElement('View', { testID: `icon-${name}` }),
  };
});
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(() => Promise.resolve()) }));

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
