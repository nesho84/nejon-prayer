import PrayerDayCell from '@/components/PrayerDayCell';
import { useThemeStore } from '@/store/themeStore';
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { TouchableOpacity } from 'react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));

const mockTheme = {
  card: '#f0f0f0',
  accent2: '#FF6B00',
  borderCard: '#dddddd',
  text2: '#555555',
  placeholder: '#aaaaaa',
  divider: '#eeeeee',
  danger: '#FF3B30',
  brown: '#A0522D',
  gray: '#8E8E93',
  pink: '#FF2D55',
  green: '#34C759',
};

beforeEach(() => {
  useThemeStore.setState({ theme: mockTheme as any });
});

describe('PrayerDayCell', () => {
  it('renders the date number', () => {
    render(<PrayerDayCell count={3} isToday={false} isFuture={false} dateNumber={14} />);
    expect(screen.getByText('14')).toBeTruthy();
  });

  it('shows fraction for a past date', () => {
    render(<PrayerDayCell count={3} isToday={false} isFuture={false} dateNumber={14} />);
    expect(screen.getByText('3/5')).toBeTruthy();
  });

  it('shows dash for a future date', () => {
    render(<PrayerDayCell count={0} isToday={false} isFuture dateNumber={20} />);
    expect(screen.getByText('—')).toBeTruthy();
  });

  it('renders a space for empty padding cell', () => {
    render(<PrayerDayCell count={0} isToday={false} isFuture={false} dateNumber={1} isEmpty />);
    expect(screen.getByText(' ')).toBeTruthy();
  });

  it('calls onPress when pressed on a past date', () => {
    const onPress = jest.fn();
    render(<PrayerDayCell count={2} isToday={false} isFuture={false} dateNumber={10} onPress={onPress} />);
    fireEvent.press(screen.getByText('10'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not render TouchableOpacity for a future date (static View)', () => {
    const onPress = jest.fn();
    const { UNSAFE_queryAllByType } = render(
      <PrayerDayCell count={0} isToday={false} isFuture dateNumber={25} onPress={onPress} />
    );
    // Should not render TouchableOpacity at all
    expect(UNSAFE_queryAllByType(TouchableOpacity).length).toBe(0);
  });
});
