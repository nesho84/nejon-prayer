import QuranPlaying from '@/components/QuranPlaying';
import { useThemeStore } from '@/store/themeStore';
import { render, screen } from '@testing-library/react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('expo-router', () => ({ router: { navigate: jest.fn() } }));
jest.mock('@react-native-vector-icons/ionicons/static', () => {
  const React = require('react');
  return { Ionicons: ({ name }: { name: string }) => React.createElement('View', { testID: `icon-${name}` }) };
});

const mockTheme = { accent: '#007AFF', card: '#fff', divider: '#eee', text2: '#555' };

beforeEach(() => {
  useThemeStore.setState({ theme: mockTheme as any });
  require('@/store/quranAudioStore').useQuranAudioStore.setState({
    isActive: false,
    isPlaying: false,
    activeSurahName: null,
  });
});

describe('QuranPlaying', () => {
  it('renders nothing when not active', () => {
    const { toJSON } = render(<QuranPlaying />);
    expect(toJSON()).toBeNull();
  });

  it('renders play icon and surah name when active', () => {
    require('@/store/quranAudioStore').useQuranAudioStore.setState({
      isActive: true,
      isPlaying: true,
      activeSurahName: 'Al-Fatiha',
    });
    render(<QuranPlaying />);
    expect(screen.getByText('Al-Fatiha')).toBeTruthy();
    expect(screen.getByTestId('icon-play-circle')).toBeTruthy();
  });
});
