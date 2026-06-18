import AppLoading from '@/components/AppLoading';
import { useThemeStore } from '@/store/themeStore';
import { render, screen } from '@testing-library/react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));

const mockTheme = { bg: '#ffffff', accent: '#007AFF', text2: '#555555' };

beforeEach(() => {
  useThemeStore.setState({ theme: mockTheme as any, isReady: true });
});

describe('AppLoading', () => {
  it('renders nothing when isReady is false', () => {
    useThemeStore.setState({ isReady: false });
    const { toJSON } = render(<AppLoading />);
    expect(toJSON()).toBeNull();
  });

  it('renders ActivityIndicator and default text', () => {
    render(<AppLoading />);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('renders custom text', () => {
    render(<AppLoading text="Please wait..." />);
    expect(screen.getByText('Please wait...')).toBeTruthy();
  });

  it('uses a full-screen container with the theme background by default', () => {
    const { UNSAFE_getByType } = render(<AppLoading />);
    const { ActivityIndicator, StyleSheet } = require('react-native');
    const container = UNSAFE_getByType(ActivityIndicator).parent;
    expect(StyleSheet.flatten(container?.props.style).backgroundColor).toBe('#ffffff');
  });

  it('uses a translucent overlay container in inline mode', () => {
    const { UNSAFE_getByType } = render(<AppLoading inline />);
    const { ActivityIndicator, StyleSheet } = require('react-native');
    const container = UNSAFE_getByType(ActivityIndicator).parent;
    expect(StyleSheet.flatten(container?.props.style).backgroundColor).toBe('rgba(0,0,0,0.75)');
  });
});
