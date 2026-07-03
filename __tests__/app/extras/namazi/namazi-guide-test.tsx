import NamaziGuideScreen from '@/app/extras/namazi/namazi-guide';
import { useLanguageStore } from '@/store/languageStore';
import { useThemeStore } from '@/store/themeStore';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Image } from 'react-native';

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
  NavigationBar: { setStyle: jest.fn() },
}));
// Reanimated 4's worklets runtime can't initialise under Jest; stub the
// pieces ImageViewer relies on so the screen can render.
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: { View },
    useSharedValue: (value: number) => ({ value }),
    useAnimatedStyle: () => ({}),
    withTiming: (value: number) => value,
  };
});
// Stub gesture-handler so the ImageViewer overlay renders without the
// native gesture module.
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');
  const builder = () => {
    const chain: Record<string, () => typeof chain> = {};
    ['onUpdate', 'onEnd', 'numberOfTaps'].forEach((m) => { chain[m] = () => chain; });
    return chain;
  };
  return {
    Gesture: { Pinch: builder, Pan: builder, Tap: builder, Simultaneous: () => ({}) },
    GestureDetector: ({ children }: { children: React.ReactNode }) => children,
    GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => React.createElement(View, null, children),
  };
});

const mockTheme = {
  bg: '#fff', bg2: '#f0f0f0', text: '#111', text2: '#555', textMuted: '#888',
  placeholder: '#999', card: '#f5f5f5', islamicGreen: '#1a8a00',
  primary: '#007AFF', accent: '#007AFF', accent2: '#FF6B00',
  statusbar: '#fff', divider2: '#ddd', border: '#ccc', borderCard: '#ddd',
  overlay: 'rgba(0,0,0,0.05)', secondary: '#06b6d4',
} as any;

const mockTr = {
  labels: { stepLabel: 'Step' },
  prayers: { Fajr: 'Fajr', Dhuhr: 'Dhuhr', Asr: 'Asr', Maghrib: 'Maghrib', Isha: 'Isha' },
} as any;

beforeEach(() => {
  useThemeStore.setState({ theme: mockTheme, resolvedTheme: 'light' as any });
  useLanguageStore.setState({ tr: mockTr, language: 'en' as any });
});

describe('NamaziGuideScreen', () => {
  it('renders the namazi screen header title', () => {
    render(<NamaziGuideScreen />);
    expect(screen.getByText('How to Pray')).toBeTruthy();
  });

  it('renders all 15 step numbers', () => {
    render(<NamaziGuideScreen />);
    for (let i = 1; i <= 15; i++) {
      expect(screen.getAllByText(String(i)).length).toBeGreaterThan(0);
    }
  });

  it('renders progress indicator at step 1 of 15', () => {
    render(<NamaziGuideScreen />);
    expect(screen.getByText('Step 1 / 15')).toBeTruthy();
  });

  it('renders the footer note', () => {
    render(<NamaziGuideScreen />);
    const { NAMAZI_GUIDE_TR } = require('@/constants/translations/namazi-guide.tr');
    expect(screen.getByText(NAMAZI_GUIDE_TR.en.footerText)).toBeTruthy();
  });

  it('expands surah block when its name is pressed', () => {
    render(<NamaziGuideScreen />);
    const { NAMAZI_SURAHS } = require('@/constants/translations/namazi-guide.tr');
    const subhanekeName = NAMAZI_SURAHS.subhaneke.name;
    // Collapsed by default: down chevron visible
    expect(screen.getAllByText('▼').length).toBeGreaterThan(0);
    // Press to expand
    fireEvent.press(screen.getAllByText(subhanekeName)[0]);
    // At least one block is now expanded: up chevron visible
    expect(screen.getAllByText('▲').length).toBeGreaterThan(0);
  });

  it('opens the image viewer when a step image is tapped', () => {
    render(<NamaziGuideScreen />);
    // Viewer closed initially
    expect(screen.queryByTestId('image-viewer-close')).toBeNull();
    fireEvent.press(screen.UNSAFE_getAllByType(Image)[0]);
    expect(screen.getByTestId('image-viewer-close')).toBeTruthy();
  });
});
