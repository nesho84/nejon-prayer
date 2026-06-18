import AppError from '@/components/AppError';
import { useThemeStore } from '@/store/themeStore';
import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return {
    Ionicons: ({ name }: { name: string }) =>
      React.createElement('View', { testID: `icon-${name}` }),
  };
});

const mockTheme = {
  bg: '#ffffff',
  text2: '#555555',
  white: '#ffffff',
};

beforeEach(() => {
  useThemeStore.setState({ theme: mockTheme as any });
});

describe('AppError', () => {
  it('renders default icon, message and button text', () => {
    render(<AppError />);
    expect(screen.getByTestId('icon-alert-circle-outline')).toBeTruthy();
    expect(screen.getByText('Something went wrong.')).toBeTruthy();
    expect(screen.getByText('Try Again')).toBeTruthy();
  });

  it('renders custom props', () => {
    render(
      <AppError
        icon="wifi-outline"
        message="No internet connection."
        buttonText="Retry"
      />
    );
    expect(screen.getByTestId('icon-wifi-outline')).toBeTruthy();
    expect(screen.getByText('No internet connection.')).toBeTruthy();
    expect(screen.getByText('Retry')).toBeTruthy();
  });

  it('calls onPress when button is pressed', () => {
    const onPress = jest.fn();
    render(<AppError onPress={onPress} />);
    fireEvent.press(screen.getByText('Try Again'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when no handler is provided', () => {
    render(<AppError />);
    // pressing with no onPress should not throw
    expect(() => fireEvent.press(screen.getByText('Try Again'))).not.toThrow();
  });
});
