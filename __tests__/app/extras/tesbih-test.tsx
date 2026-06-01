import TesbihScreen from '@/app/extras/tesbih';
import { useLanguageStore } from '@/store/languageStore';
import { useTesbihStore } from '@/store/tesbihStore';
import { useThemeStore } from '@/store/themeStore';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Vibration } from 'react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, null, children);
  },
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-navigation-bar', () => ({
  NavigationBar: () => null,
}));
jest.mock('react-native-svg', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children }: any) => React.createElement('View', { testID: 'svg' }, children),
    Circle: () => React.createElement('View', { testID: 'circle' }),
  };
});
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return {
    Ionicons: ({ name }: { name: string }) =>
      React.createElement('View', { testID: `icon-${name}` }),
    MaterialCommunityIcons: ({ name }: { name: string }) =>
      React.createElement('View', { testID: `icon-${name}` }),
  };
});

const mockTheme = {
  bg: '#fff', text: '#111', text2: '#555', primary: '#007AFF',
  card: '#f5f5f5', divider: '#eee', border: '#ddd',
  placeholder: '#999',
} as any;

const mockTr = {
  labels: {
    loading: 'Loading...',
    tInstruction: 'Tap the circle to count',
    tLap: 'Lap', tLimit: 'Limit',
  },
} as any;

beforeEach(() => {
  useThemeStore.setState({ theme: mockTheme, resolvedTheme: 'light' as any });
  useLanguageStore.setState({ tr: mockTr });
  useTesbihStore.setState({ count: 0, totalCount: 10, laps: 0, isReady: true });
  jest.clearAllMocks();
});

describe('TesbihScreen', () => {
  it('shows loading when store is not ready', () => {
    useTesbihStore.setState({ isReady: false });
    render(<TesbihScreen />);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('renders instruction text', () => {
    render(<TesbihScreen />);
    expect(screen.getByText('Tap the circle to count')).toBeTruthy();
  });

  it('increments count when circle is pressed', () => {
    useTesbihStore.setState({ count: 8, totalCount: 33, laps: 0, isReady: true });
    render(<TesbihScreen />);
    fireEvent.press(screen.getByText('8'));
    expect(useTesbihStore.getState().count).toBe(9);
  });

  it('vibrates and resets count when total is reached', () => {
    jest.spyOn(Vibration, 'vibrate').mockImplementation(() => { });
    useTesbihStore.setState({ count: 9, totalCount: 10, laps: 0, isReady: true });
    render(<TesbihScreen />);
    fireEvent.press(screen.getByText('9'));
    expect(useTesbihStore.getState().count).toBe(0);
    expect(useTesbihStore.getState().laps).toBe(1);
    expect(Vibration.vibrate).toHaveBeenCalledWith(300);
  });

  it('sets preset when a preset chip is pressed', () => {
    render(<TesbihScreen />);
    fireEvent.press(screen.getByText('33'));
    expect(useTesbihStore.getState().totalCount).toBe(33);
    expect(useTesbihStore.getState().count).toBe(0);
  });

  it('resets count and laps when reload button is pressed', () => {
    jest.spyOn(Vibration, 'vibrate').mockImplementation(() => { });
    useTesbihStore.setState({ count: 5, totalCount: 10, laps: 2, isReady: true });
    render(<TesbihScreen />);
    fireEvent.press(screen.getByTestId('icon-reload'));
    expect(useTesbihStore.getState().count).toBe(0);
    expect(useTesbihStore.getState().laps).toBe(0);
  });

  it('increments totalCount when plus button is pressed', () => {
    render(<TesbihScreen />);
    fireEvent.press(screen.getByTestId('icon-plus'));
    expect(useTesbihStore.getState().totalCount).toBe(11);
  });

  it('decrements totalCount when minus button is pressed', () => {
    render(<TesbihScreen />);
    fireEvent.press(screen.getByTestId('icon-minus'));
    expect(useTesbihStore.getState().totalCount).toBe(9);
  });
});
