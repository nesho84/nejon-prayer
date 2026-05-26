import AppLoading from '@/components/AppLoading';
import { useThemeStore } from '@/store/themeStore';
import { render, screen } from '@testing-library/react-native';
import React from 'react';

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

  it('renders ActivityIndicator in full mode', () => {
    const { UNSAFE_getByType } = render(<AppLoading />);
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('renders ActivityIndicator in inline mode', () => {
    const { UNSAFE_getByType } = render(<AppLoading inline />);
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });
});
