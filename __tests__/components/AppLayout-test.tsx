import AppLayout from '@/components/AppLayout';
import { useThemeStore } from '@/store/themeStore';
import { NavigationBar } from 'expo-navigation-bar';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, style }: any) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { style, testID: 'safe-area-view' }, children);
  },
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-navigation-bar', () => ({
  NavigationBar: { setStyle: jest.fn() },
}));

beforeEach(() => {
  (NavigationBar.setStyle as jest.Mock).mockClear();
  useThemeStore.setState({ theme: { bg: '#ffffff' } as any, resolvedTheme: 'light' as any });
});

describe('AppLayout', () => {
  it('renders children and sets the navigation bar style for the light theme', () => {
    render(<AppLayout><Text>Hello</Text></AppLayout>);
    expect(screen.getByText('Hello')).toBeTruthy();
    expect(NavigationBar.setStyle).toHaveBeenCalledWith('dark');
  });

  it('renders children and sets the navigation bar style for the dark theme', () => {
    useThemeStore.setState({ theme: { bg: '#000000' } as any, resolvedTheme: 'dark' as any });
    render(<AppLayout><Text>Dark</Text></AppLayout>);
    expect(screen.getByText('Dark')).toBeTruthy();
    expect(NavigationBar.setStyle).toHaveBeenCalledWith('light');
  });
});
