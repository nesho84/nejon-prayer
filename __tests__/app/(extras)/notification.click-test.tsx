import NotificationClick from '@/app/notification.click';
import { render, screen } from '@testing-library/react-native';

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
