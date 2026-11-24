import SupporterBanner from '@/components/SupporterBanner';
import { useAdsStore } from '@/store/adsStore';
import { useLanguageStore } from '@/store/languageStore';
import { useSupporterStore } from '@/store/supporterStore';
import { useThemeStore } from '@/store/themeStore';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Platform } from 'react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('@/services/billingService', () => ({}));
jest.mock('@/services/adsService', () => ({}));
jest.mock('expo-router', () => ({ router: { navigate: jest.fn() } }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@react-native-vector-icons/ionicons/static', () => {
  const React = require('react');
  return { Ionicons: ({ name }: { name: string }) => React.createElement('View', { testID: `icon-${name}` }) };
});
jest.mock('@react-native-vector-icons/material-design-icons/static', () => {
  const React = require('react');
  return { MaterialDesignIcons: ({ name }: { name: string }) => React.createElement('View', { testID: `icon-${name}` }) };
});

const mockTheme = { bg: '#fff', border: '#ddd', text: '#111', text2: '#222', textSecondary: '#555', pink: '#f0a' } as any;

beforeEach(() => {
  jest.clearAllMocks();
  (Platform as { OS: string }).OS = 'android';
  useThemeStore.setState({ theme: mockTheme });
  useLanguageStore.setState({ language: 'en' as any });
  useAdsStore.setState({ bannerDismissed: false });
  useSupporterStore.setState({ isSupporter: false, bannerVisible: false, bannerNextShowAt: null });
});

describe('SupporterBanner', () => {
  it('stays hidden while the banner is showing', () => {
    render(<SupporterBanner />);
    expect(screen.queryByText('Support the app')).toBeNull();
  });

  it('appears in the banner slot when the banner is closed', () => {
    render(<SupporterBanner />);
    act(() => useAdsStore.setState({ bannerDismissed: true }));
    expect(screen.getByText('Support the app')).toBeTruthy();
    expect(screen.getByText('No ads for supporters')).toBeTruthy();
  });

  it('opens the support screen and closes itself', () => {
    const { router } = require('expo-router');
    render(<SupporterBanner />);
    act(() => useAdsStore.setState({ bannerDismissed: true }));
    fireEvent.press(screen.getByText('Support the app'));
    expect(router.navigate).toHaveBeenCalledWith('/extras/supporter');
    expect(screen.queryByText('Support the app')).toBeNull();
  });

  it('closes with its X', () => {
    render(<SupporterBanner />);
    act(() => useAdsStore.setState({ bannerDismissed: true }));
    fireEvent.press(screen.getByLabelText('Close'));
    expect(screen.queryByText('Support the app')).toBeNull();
  });

  it('goes away when the banner comes back', () => {
    render(<SupporterBanner />);
    act(() => useAdsStore.setState({ bannerDismissed: true }));
    act(() => useAdsStore.setState({ bannerDismissed: false }));
    expect(screen.queryByText('Support the app')).toBeNull();
  });

  it('does not come back before its next show time', () => {
    useSupporterStore.setState({ bannerNextShowAt: Date.now() + 60_000 });
    render(<SupporterBanner />);
    act(() => useAdsStore.setState({ bannerDismissed: true }));
    expect(screen.queryByText('Support the app')).toBeNull();
  });

  it('never shows for a supporter', () => {
    useSupporterStore.setState({ isSupporter: true });
    render(<SupporterBanner />);
    act(() => useAdsStore.setState({ bannerDismissed: true }));
    expect(screen.queryByText('Support the app')).toBeNull();
  });

  it('never shows on iOS for now', () => {
    (Platform as { OS: string }).OS = 'ios';
    render(<SupporterBanner />);
    act(() => useAdsStore.setState({ bannerDismissed: true }));
    expect(screen.queryByText('Support the app')).toBeNull();
  });
});
