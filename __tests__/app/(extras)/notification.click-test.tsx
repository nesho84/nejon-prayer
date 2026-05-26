import NotificationClick from '@/app/(extras)/notification.click';
import { render, screen } from '@testing-library/react-native';
import React from 'react';

jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { testID: `redirect-${href}` });
  },
}));

describe('NotificationClick', () => {
  it('redirects to root', () => {
    render(<NotificationClick />);
    expect(screen.getByTestId('redirect-/')).toBeTruthy();
  });
});
