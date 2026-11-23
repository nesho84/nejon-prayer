import SupporterScreen from '@/app/extras/supporter';
import { useLanguageStore } from '@/store/languageStore';
import { useSupporterStore } from '@/store/supporterStore';
import { useThemeStore } from '@/store/themeStore';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('@/services/billingService', () => ({}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, null, children);
  },
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-navigation-bar', () => ({ NavigationBar: { setStyle: jest.fn() } }));
jest.mock('@react-native-vector-icons/material-design-icons/static', () => {
  const React = require('react');
  return { MaterialDesignIcons: ({ name }: { name: string }) => React.createElement('View', { testID: `icon-${name}` }) };
});

const mockTheme = {
  bg: '#fff', card: '#eee', text: '#111', text2: '#222', textSecondary: '#555',
  primary: '#00f', secondary: '#0af', success: '#0a0', pink: '#f0a', divider2: '#ccc',
} as any;

const mockLoadProducts = jest.fn();
const mockBuy = jest.fn();
const mockSyncPurchases = jest.fn();

// Play answered with fresh prices — the normal "can buy" state
const READY_STATE = {
  isSupporter: false,
  supporterSince: null,
  unlockPending: false,
  giftPending: false,
  lastGiftAt: null,
  lastKnownPrices: { supporter_unlock: '€5.99', gift_small: '€1.99', gift_medium: '€4.99', gift_large: '€9.99' },
  playStatus: 'ready' as const,
  productsFresh: true,
  purchasingId: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  useThemeStore.setState({ theme: mockTheme });
  useLanguageStore.setState({ language: 'en', tr: { labels: { localeDate: 'en-GB' } } as any });
  useSupporterStore.setState({
    ...READY_STATE,
    loadProducts: mockLoadProducts,
    buy: mockBuy,
    syncPurchases: mockSyncPurchases,
  });
});

describe('SupporterScreen — on open', () => {
  it('fetches fresh product details on every visit', () => {
    render(<SupporterScreen />);
    expect(mockLoadProducts).toHaveBeenCalledTimes(1);
  });

  it('explains why, and that a gift unlocks nothing', () => {
    render(<SupporterScreen />);
    expect(screen.getByText('Why support?')).toBeTruthy();
    expect(screen.getByText("Doesn't remove ads — just a thank you")).toBeTruthy();
  });
});

describe('SupporterScreen — unlock', () => {
  it('shows Play\'s price and buys the unlock', () => {
    render(<SupporterScreen />);
    fireEvent.press(screen.getByText('Unlock · €5.99'));
    expect(mockBuy).toHaveBeenCalledWith('supporter_unlock');
  });

  it('shows a pending payment without unlocking or a buy button', () => {
    useSupporterStore.setState({ unlockPending: true });
    render(<SupporterScreen />);
    expect(screen.getByText('Waiting for Google Play to confirm the payment')).toBeTruthy();
    expect(screen.getByText('Payment pending')).toBeTruthy();
    expect(screen.queryByText('Unlock · €5.99')).toBeNull();
  });

  it('offers Try again when Play is unreachable', () => {
    useSupporterStore.setState({ playStatus: 'unavailable', productsFresh: false });
    render(<SupporterScreen />);
    expect(screen.getByText("Can't reach Google Play right now")).toBeTruthy();
    mockLoadProducts.mockClear();
    fireEvent.press(screen.getByText('Try again'));
    expect(mockLoadProducts).toHaveBeenCalledTimes(1);
  });

  it('shows the supporter state with Play\'s purchase month', () => {
    useSupporterStore.setState({ isSupporter: true, supporterSince: new Date(2026, 10, 20).getTime() });
    render(<SupporterScreen />);
    expect(screen.getByText('Thank you for supporting Nejon Prayer')).toBeTruthy();
    expect(screen.getByText('Supporter since November 2026')).toBeTruthy();
    expect(screen.queryByText('Unlock · €5.99')).toBeNull();
  });
});

describe('SupporterScreen — gifts', () => {
  it('buys a gift with its fresh price', () => {
    render(<SupporterScreen />);
    fireEvent.press(screen.getByText('Small'));
    expect(mockBuy).toHaveBeenCalledWith('gift_small');
  });

  it('shows last known prices but does not buy when Play is unreachable', () => {
    useSupporterStore.setState({ playStatus: 'unavailable', productsFresh: false });
    render(<SupporterScreen />);
    expect(screen.getByText('Last known prices — reconnect to give')).toBeTruthy();
    expect(screen.getByText('€4.99')).toBeTruthy();
    fireEvent.press(screen.getByText('Medium'));
    expect(mockBuy).not.toHaveBeenCalled();
  });

  it('thanks for the last gift with its date', () => {
    useSupporterStore.setState({ lastGiftAt: new Date(2026, 10, 20).getTime() });
    render(<SupporterScreen />);
    expect(screen.getByText('Gift received on 20 November 2026 — thank you')).toBeTruthy();
  });

  it('tells a supporter that a gift is extra support', () => {
    useSupporterStore.setState({ isSupporter: true, supporterSince: 1 });
    render(<SupporterScreen />);
    expect(screen.getByText("You're already ad-free — a gift is just extra support")).toBeTruthy();
  });

  it('blocks gifts while a gift payment is pending', () => {
    useSupporterStore.setState({ giftPending: true });
    render(<SupporterScreen />);
    expect(screen.getByText('Gift payment pending — waiting for Google Play')).toBeTruthy();
    fireEvent.press(screen.getByText('Large'));
    expect(mockBuy).not.toHaveBeenCalled();
  });
});

describe('SupporterScreen — restore', () => {
  it('confirms a restored unlock in place', async () => {
    mockSyncPurchases.mockImplementation(async () => {
      useSupporterStore.setState({ isSupporter: true, supporterSince: 1 });
      return true;
    });
    render(<SupporterScreen />);
    await act(async () => fireEvent.press(screen.getByText('Restore purchases')));
    expect(screen.getByText('Supporter restored')).toBeTruthy();
  });

  it('says when there is nothing to restore', async () => {
    mockSyncPurchases.mockResolvedValue(true);
    render(<SupporterScreen />);
    await act(async () => fireEvent.press(screen.getByText('Restore purchases')));
    expect(screen.getByText('No purchases to restore')).toBeTruthy();
  });

  it('says when Play could not be reached', async () => {
    mockSyncPurchases.mockResolvedValue(false);
    render(<SupporterScreen />);
    await act(async () => fireEvent.press(screen.getByText('Restore purchases')));
    expect(screen.getByText("Can't reach Google Play")).toBeTruthy();
  });
});
