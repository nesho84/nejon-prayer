import AppWarningStrip from '@/components/AppWarningStrip';
import { useThemeStore } from '@/store/themeStore';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { View } from 'react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));

jest.mock('@react-native-vector-icons/ionicons/static', () => {
  const React = require('react');
  return {
    Ionicons: ({ name }: { name: string }) =>
      React.createElement('View', { testID: `icon-${name}` }),
  };
});

const mockTheme = {
  warning: '#ff9800',
  accent2: '#b26a00',
};

beforeEach(() => {
  useThemeStore.setState({ theme: mockTheme as any });
});

describe('AppWarningStrip', () => {
  it('renders the passed icon, the text and the chevron', () => {
    render(
      <AppWarningStrip
        icon={<View testID="strip-icon" />}
        text="Prayer times are outdated"
        onPress={() => { }}
      />
    );
    expect(screen.getByTestId('strip-icon')).toBeTruthy();
    expect(screen.getByText('Prayer times are outdated')).toBeTruthy();
    expect(screen.getByTestId('icon-chevron-forward')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    render(
      <AppWarningStrip
        icon={<View testID="strip-icon" />}
        text="You seem to have moved"
        onPress={onPress}
      />
    );
    fireEvent.press(screen.getByText('You seem to have moved'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
