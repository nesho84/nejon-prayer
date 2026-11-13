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
jest.mock('@react-native-vector-icons/material-design-icons/static', () => {
  const React = require('react');
  return {
    MaterialDesignIcons: ({ name, color }: { name: string; color: string }) =>
      React.createElement('View', { testID: `mdi-${name}`, color }),
  };
});

const mockTheme = {
  warning: '#ff9800',
  accent2: '#b26a00',
  textSecondary: '#999999',
  success: '#00aa00',
  danger: '#ff0000',
};

beforeEach(() => {
  useThemeStore.setState({ theme: mockTheme as any });
});

describe('AppWarningStrip', () => {
  it('renders the passed icon, the text and the settings icon', () => {
    render(
      <AppWarningStrip
        icon={<View testID="strip-icon" />}
        text="Prayer times are outdated"
        onPress={() => { }}
      />
    );
    expect(screen.getByTestId('strip-icon')).toBeTruthy();
    expect(screen.getByText('Prayer times are outdated')).toBeTruthy();
    expect(screen.getByTestId('icon-settings-outline')).toBeTruthy();
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

  it('renders title, text, chips and a button', () => {
    render(
      <AppWarningStrip
        title="Prayer times not downloaded"
        text="Turn on location and internet"
        chips={[
          { icon: 'map-marker-off-outline', label: 'Location off', ok: false },
          { icon: 'wifi', label: 'Online', ok: true },
        ]}
        buttonText="Retry"
        onPress={() => { }}
      />
    );
    expect(screen.getByText('Prayer times not downloaded')).toBeTruthy();
    expect(screen.getByText('Turn on location and internet')).toBeTruthy();
    expect(screen.getByText('Location off')).toBeTruthy();
    expect(screen.getByText('Online')).toBeTruthy();
    expect(screen.getByText('Retry')).toBeTruthy();
  });

  it('colors missing chips with danger and OK chips with success', () => {
    render(
      <AppWarningStrip
        text="Status"
        chips={[
          { icon: 'map-marker-off-outline', label: 'Location off', ok: false },
          { icon: 'wifi', label: 'Online', ok: true },
        ]}
        buttonText="Retry"
        onPress={() => { }}
      />
    );
    expect(screen.getByTestId('mdi-map-marker-off-outline').props.color).toBe(mockTheme.danger);
    expect(screen.getByTestId('mdi-wifi').props.color).toBe(mockTheme.success);
  });

  it('calls onPress from the button', () => {
    const onPress = jest.fn();
    render(<AppWarningStrip text="Status" buttonText="Retry" onPress={onPress} />);
    fireEvent.press(screen.getByText('Retry'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
