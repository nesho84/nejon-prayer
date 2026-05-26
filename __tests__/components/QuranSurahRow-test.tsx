import QuranSurahRow from '@/components/QuranSurahRow';
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('expo-router', () => ({ router: { navigate: jest.fn() } }));
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return {
    Ionicons: ({ name }: { name: string }) => React.createElement('View', { testID: `icon-${name}` }),
    MaterialCommunityIcons: ({ name }: { name: string }) => React.createElement('View', { testID: `mci-${name}` }),
  };
});

const mockTheme = {
  card: '#fff', accent: '#007AFF', text2: '#555', text: '#111',
  danger: '#FF3B30', borderCard: '#ddd', accent2: '#FF6B00',
  accentLight: '#e0f0ff', divider: '#eee',
} as any;
const mockTr = { labels: { ayahs: 'Ayahs' }, buttons: {} } as any;

const mockSurah = {
  id: 1, name: 'الفاتحة', transliteration: 'Al-Fatiha',
  translation: 'The Opening', total_verses: 7,
};

const baseProps = {
  surah: mockSurah as any,
  theme: mockTheme,
  tr: mockTr,
  activeSurahId: null,
  isPlaying: false,
  isBufferingActive: false,
  hasFinished: false,
  hasError: false,
  currentProgress: 0,
  totalDuration: 0,
  rowHeight: 64,
  onPlayPauseReplay: jest.fn(),
  onStop: jest.fn(),
};

describe('QuranSurahRow', () => {
  it('renders surah transliteration and ayah count', () => {
    render(<QuranSurahRow {...baseProps} />);
    expect(screen.getByText('Al-Fatiha')).toBeTruthy();
    expect(screen.getByText(/7\s*Ayahs/)).toBeTruthy();
  });

  it('navigates to ayahs screen on row press', () => {
    const { router } = require('expo-router');
    render(<QuranSurahRow {...baseProps} />);
    fireEvent.press(screen.getByText('Al-Fatiha'));
    expect(router.navigate).toHaveBeenCalledWith(expect.objectContaining({
      pathname: '/(quran)/ayahs',
    }));
  });

  it('calls onPlayPauseReplay when play button is pressed', () => {
    const onPlayPauseReplay = jest.fn();
    render(<QuranSurahRow {...baseProps} onPlayPauseReplay={onPlayPauseReplay} />);
    fireEvent.press(screen.getByTestId('icon-play-circle'));
    expect(onPlayPauseReplay).toHaveBeenCalledWith(mockSurah);
  });
});
