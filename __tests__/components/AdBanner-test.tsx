import AdBanner from '@/components/AdBanner';
import { useAdsStore } from '@/store/adsStore';
import { useThemeStore } from '@/store/themeStore';
import NetInfo from '@react-native-community/netinfo';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('@react-native-vector-icons/ionicons/static', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { Ionicons: ({ name }: any) => React.createElement(View, { testID: `icon-${name}` }) };
});
jest.mock('@react-native-community/netinfo', () => ({ addEventListener: jest.fn() }));
// Press = ad loaded, long-press = load failure — the only way to drive the native view's callbacks
jest.mock('react-native-google-mobile-ads', () => {
  const React = require('react');
  const { Pressable } = require('react-native');
  const BannerAd = React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({ load: mockLoad }));
    return React.createElement(Pressable, {
      testID: 'banner-ad',
      onPress: () => props.onAdLoaded?.({ width: 320, height: 50 }),
      onLongPress: () => props.onAdFailedToLoad?.(new Error('no fill')),
    });
  });
  return {
    __esModule: true,
    BannerAd,
    BannerAdSize: { BANNER: 'BANNER' },
    TestIds: { BANNER: 'test-banner-id' },
  };
});

const mockLoad = jest.fn();
const CONNECTIVITY_DEBOUNCE_MS = 2500;

const mockTheme = {
  bg: '#000', border: '#333', placeholder: '#aaa', pressed: 'rgba(255,255,255,0.1)',
} as any;

// Captured NetInfo listener — lets each test drive connectivity by hand
let netInfoListener: ((state: any) => void) | undefined;
const mockUnsubscribe = jest.fn();

// Pushes a connectivity reading. The first is applied immediately by the component;
// later ones are debounced, so advance timers unless testing the pending window.
function emitConnectivity(isConnected: boolean, { settle = true } = {}) {
  act(() => {
    netInfoListener?.({ isConnected, isInternetReachable: isConnected });
  });
  if (settle) {
    act(() => {
      jest.advanceTimersByTime(CONNECTIVITY_DEBOUNCE_MS);
    });
  }
}

// The wrapper collapses to zero height until an ad has actually rendered
function isCollapsed() {
  const { StyleSheet } = require('react-native');
  const style = StyleSheet.flatten(screen.getByTestId('ad-banner-container').props.style);
  return style?.height === 0;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  netInfoListener = undefined;
  (NetInfo.addEventListener as jest.Mock).mockImplementation((listener) => {
    netInfoListener = listener;
    return mockUnsubscribe;
  });
  useThemeStore.setState({ theme: mockTheme });
  useAdsStore.setState({ canRequestAds: true });
});

afterEach(() => {
  jest.useRealTimers();
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('AdBanner — consent gate', () => {
  it('renders nothing when consent means ads cannot be requested', () => {
    useAdsStore.setState({ canRequestAds: false });

    render(<AdBanner />);
    emitConnectivity(true);

    expect(screen.queryByTestId('banner-ad')).toBeNull();
  });

  it('renders the banner once ads can be requested and the device is online', () => {
    render(<AdBanner />);
    emitConnectivity(true);

    expect(screen.getByTestId('banner-ad')).toBeTruthy();
  });
});

describe('AdBanner — connectivity gating', () => {
  it('never mounts the ad when starting up offline', () => {
    render(<AdBanner />);
    emitConnectivity(false);

    expect(screen.queryByTestId('banner-ad')).toBeNull();
  });

  it('mounts the ad once connectivity arrives', () => {
    render(<AdBanner />);
    emitConnectivity(false);
    expect(screen.queryByTestId('banner-ad')).toBeNull();

    emitConnectivity(true);

    expect(screen.getByTestId('banner-ad')).toBeTruthy();
  });

  it('debounces connectivity changes so flapping does not act on every event', () => {
    render(<AdBanner />);
    emitConnectivity(false);

    // Flap several times without letting the debounce settle
    emitConnectivity(true, { settle: false });
    emitConnectivity(false, { settle: false });
    emitConnectivity(true, { settle: false });
    expect(screen.queryByTestId('banner-ad')).toBeNull();

    act(() => {
      jest.advanceTimersByTime(CONNECTIVITY_DEBOUNCE_MS);
    });

    // One settled transition, one mount
    expect(screen.getByTestId('banner-ad')).toBeTruthy();
  });

  it('treats unresolved reachability as online — null must not read as offline', () => {
    render(<AdBanner />);

    // NetInfo emits isInternetReachable: null while its probe is still running
    act(() => {
      netInfoListener?.({ isConnected: true, isInternetReachable: null });
    });

    // Mounted immediately, without waiting out a debounce window
    expect(screen.getByTestId('banner-ad')).toBeTruthy();
  });

  it('does not double-request when connectivity first arrives — mounting already requests', () => {
    render(<AdBanner />);
    emitConnectivity(false);

    emitConnectivity(true);

    expect(screen.getByTestId('banner-ad')).toBeTruthy();
    expect(mockLoad).not.toHaveBeenCalled();
  });

  it('forces a retry when connectivity returns and no ad ever loaded', () => {
    render(<AdBanner />);
    emitConnectivity(true);
    expect(mockLoad).not.toHaveBeenCalled();

    emitConnectivity(false);
    emitConnectivity(true);

    expect(mockLoad).toHaveBeenCalledTimes(1);
  });

  it('does not force a retry when an ad has already loaded', () => {
    render(<AdBanner />);
    emitConnectivity(true);
    fireEvent.press(screen.getByTestId('banner-ad'));

    emitConnectivity(false);
    emitConnectivity(true);

    expect(mockLoad).not.toHaveBeenCalled();
  });

  it('unsubscribes from NetInfo on unmount', () => {
    const { unmount } = render(<AdBanner />);

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});

describe('AdBanner — collapse', () => {
  it('collapses to zero height before the ad loads', () => {
    render(<AdBanner />);
    emitConnectivity(true);

    expect(isCollapsed()).toBe(true);
    expect(screen.queryByTestId('icon-close')).toBeNull();
  });

  it('expands once the ad has loaded', () => {
    render(<AdBanner />);
    emitConnectivity(true);

    fireEvent.press(screen.getByTestId('banner-ad'));

    expect(isCollapsed()).toBe(false);
    expect(screen.getByTestId('icon-close')).toBeTruthy();
  });

  it('stays collapsed but keeps the ad mounted when the first load fails', () => {
    render(<AdBanner />);
    emitConnectivity(true);

    fireEvent(screen.getByTestId('banner-ad'), 'longPress');

    expect(isCollapsed()).toBe(true);
    // Collapsed, not unmounted — the ad must stay mounted to ever load
    expect(screen.getByTestId('banner-ad')).toBeTruthy();
  });

  it('keeps a visible ad expanded when a later refresh fails', () => {
    render(<AdBanner />);
    emitConnectivity(true);
    fireEvent.press(screen.getByTestId('banner-ad'));

    fireEvent(screen.getByTestId('banner-ad'), 'longPress');

    expect(isCollapsed()).toBe(false);
    expect(screen.getByTestId('icon-close')).toBeTruthy();
  });

  it('keeps a visible ad expanded when the device goes offline', () => {
    render(<AdBanner />);
    emitConnectivity(true);
    fireEvent.press(screen.getByTestId('banner-ad'));

    emitConnectivity(false);

    expect(isCollapsed()).toBe(false);
    expect(screen.getByTestId('banner-ad')).toBeTruthy();
  });
});

describe('AdBanner — logging', () => {
  it('warns when a load fails while online', () => {
    render(<AdBanner />);
    emitConnectivity(true);

    fireEvent(screen.getByTestId('banner-ad'), 'longPress');

    expect(console.warn).toHaveBeenCalled();
  });

  it('stays quiet when a load fails while offline', () => {
    render(<AdBanner />);
    emitConnectivity(true);
    emitConnectivity(false);

    fireEvent(screen.getByTestId('banner-ad'), 'longPress');

    expect(console.warn).not.toHaveBeenCalled();
  });
});

describe('AdBanner — dismissal', () => {
  it('removes the banner entirely when dismissed', () => {
    render(<AdBanner />);
    emitConnectivity(true);
    fireEvent.press(screen.getByTestId('banner-ad'));

    fireEvent.press(screen.getByTestId('icon-close').parent!);

    expect(screen.queryByTestId('banner-ad')).toBeNull();
    expect(screen.queryByTestId('icon-close')).toBeNull();
  });

  it('stays dismissed across re-renders — dismissal is per-session', () => {
    const { rerender } = render(<AdBanner />);
    emitConnectivity(true);
    fireEvent.press(screen.getByTestId('banner-ad'));
    fireEvent.press(screen.getByTestId('icon-close').parent!);

    rerender(<AdBanner />);

    expect(screen.queryByTestId('banner-ad')).toBeNull();
  });
});
