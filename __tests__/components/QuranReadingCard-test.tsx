import QuranReadingCard from '@/components/QuranReadingCard';
import { useLanguageStore } from '@/store/languageStore';
import { useQuranStore } from '@/store/quranStore';
import { useThemeStore } from '@/store/themeStore';
import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('expo-router', () => ({ router: { navigate: jest.fn() } }));
jest.mock('@react-native-vector-icons/ionicons/static', () => {
  const React = require('react');
  return { Ionicons: ({ name }: { name: string }) => React.createElement('View', { testID: `icon-${name}` }) };
});
jest.mock('@react-native-vector-icons/material-icons/static', () => {
  const React = require('react');
  return { MaterialIcons: ({ name }: { name: string }) => React.createElement('View', { testID: `mi-${name}` }) };
});

const mockTheme = {
  text: '#111', text2: '#555', card: '#fff', overlayLight: '#f5f5f5',
  border: '#ddd', borderCard: '#ddd', gold: '#FFD700',
};
const mockTr = {
  labels: {
    read: 'Read', khatam: 'Khatam',
    continueReading: 'Continue Reading', startReading: 'Start Reading',
    continueKhatam: 'Continue Khatam', startKhatam: 'Start Khatam',
    khatamResetTitle: 'Reset Khatam', khatamResetMessage: 'Are you sure?', khatamReset: 'Reset',
  },
  buttons: { cancel: 'Cancel' },
};

beforeEach(() => {
  useThemeStore.setState({ theme: mockTheme as any });
  useLanguageStore.setState({ tr: mockTr as any });
  useQuranStore.setState({
    lastReadSurahId: 2, lastReadSurahName: 'Al-Baqarah', lastReadAyahId: 5,
    lastKhatamSurahId: null, lastKhatamSurahName: null, lastKhatamAyahId: null,
    khatamCount: 0,
  } as any);
});

describe('QuranReadingCard', () => {
  it('renders read/khatam mode toggle', () => {
    render(<QuranReadingCard />);
    expect(screen.getByText('Read')).toBeTruthy();
    expect(screen.getByText('Khatam')).toBeTruthy();
  });

  it('shows continue reading label when last read exists', () => {
    render(<QuranReadingCard />);
    expect(screen.getByText('Continue Reading')).toBeTruthy();
  });

  it('navigates to ayahs screen on press', () => {
    const { router } = require('expo-router');
    render(<QuranReadingCard />);
    fireEvent.press(screen.getByText('Continue Reading'));
    expect(router.navigate).toHaveBeenCalledWith(expect.objectContaining({
      pathname: '/quran/ayahs',
    }));
  });
});
