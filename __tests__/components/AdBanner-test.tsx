import AdBanner from '@/components/AdBanner';
import { useAdsStore } from '@/store/adsStore';
import { useThemeStore } from '@/store/themeStore';
import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('@react-native-vector-icons/ionicons/static', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { Ionicons: ({ name }: any) => React.createElement(View, { testID: `icon-${name}` }) };
});
// Press = ad loaded, long-press = load failure — the only way to drive the native view's callbacks
jest.mock('react-native-google-mobile-ads', () => {
  const React = require('react');
  const { Pressable } = require('react-native');
  return {
    __esModule: true,
    BannerAd: (props: any) =>
      React.createElement(Pressable, {
        testID: 'banner-ad',
        onPress: () => props.onAdLoaded?.({ width: 320, height: 50 }),
        onLongPress: () => props.onAdFailedToLoad?.(new Error('no fill')),
      }),
    BannerAdSize: { BANNER: 'BANNER' },
    TestIds: { BANNER: 'test-banner-id' },
  };
});

const mockTheme = {
  bg: '#000', border: '#333', placeholder: '#aaa', pressed: 'rgba(255,255,255,0.1)',
} as any;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  useThemeStore.setState({ theme: mockTheme });
  useAdsStore.setState({ canRequestAds: true });
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('AdBanner — consent gate', () => {
  it('renders nothing when consent means ads cannot be requested', () => {
    useAdsStore.setState({ canRequestAds: false });

    render(<AdBanner />);

    expect(screen.queryByTestId('banner-ad')).toBeNull();
  });

  it('renders the banner once ads can be requested', () => {
    render(<AdBanner />);

    expect(screen.getByTestId('banner-ad')).toBeTruthy();
  });
});

describe('AdBanner — load state', () => {
  it('shows no close control before the ad loads', () => {
    render(<AdBanner />);

    expect(screen.queryByTestId('icon-close')).toBeNull();
  });

  it('shows the close control once the ad has loaded', () => {
    render(<AdBanner />);

    fireEvent.press(screen.getByTestId('banner-ad'));

    expect(screen.getByTestId('icon-close')).toBeTruthy();
  });

  it('warns and keeps the close control hidden when the ad fails to load', () => {
    render(<AdBanner />);

    fireEvent(screen.getByTestId('banner-ad'), 'longPress');

    expect(console.warn).toHaveBeenCalled();
    expect(screen.queryByTestId('icon-close')).toBeNull();
  });
});

describe('AdBanner — dismissal', () => {
  it('removes the banner entirely when dismissed', () => {
    render(<AdBanner />);
    fireEvent.press(screen.getByTestId('banner-ad'));

    fireEvent.press(screen.getByTestId('icon-close').parent!);

    expect(screen.queryByTestId('banner-ad')).toBeNull();
    expect(screen.queryByTestId('icon-close')).toBeNull();
  });

  it('stays dismissed across re-renders — dismissal is per-session', () => {
    const { rerender } = render(<AdBanner />);
    fireEvent.press(screen.getByTestId('banner-ad'));
    fireEvent.press(screen.getByTestId('icon-close').parent!);

    rerender(<AdBanner />);

    expect(screen.queryByTestId('banner-ad')).toBeNull();
  });
});
