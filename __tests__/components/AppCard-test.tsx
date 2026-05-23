jest.mock('@/store/storage', () => ({
  mmkvStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

import AppCard from '@/components/AppCard';
import { useThemeStore } from '@/store/themeStore';
import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

beforeEach(() => {
  useThemeStore.setState({ theme: { card: '#ffffff' } as any });
});

describe('AppCard', () => {
  it('renders its children', () => {
    render(<AppCard><Text testID="child">hello</Text></AppCard>);
    expect(screen.getByTestId('child')).toBeTruthy();
  });

  it('applies the card background color from the theme', () => {
    useThemeStore.setState({ theme: { card: '#123456' } as any });
    render(<AppCard testID="card"><Text>x</Text></AppCard>);
    const card = screen.getByTestId('card');
    expect(card.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ backgroundColor: '#123456' })])
    );
  });

  it('merges an extra style prop', () => {
    render(<AppCard testID="card" style={{ margin: 8 }}><Text>x</Text></AppCard>);
    const card = screen.getByTestId('card');
    expect(card.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ margin: 8 })])
    );
  });

  it('forwards extra ViewProps', () => {
    render(<AppCard testID="card" accessibilityLabel="my card"><Text>x</Text></AppCard>);
    expect(screen.getByTestId('card').props.accessibilityLabel).toBe('my card');
  });
});
