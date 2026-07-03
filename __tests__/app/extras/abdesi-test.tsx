import AbdesiScreen from '@/app/extras/abdesi';
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
  bg: '#fff', text: '#111', text2: '#555', placeholder: '#999',
  card: '#f5f5f5', secondary: '#06b6d4', statusbar: '#fff',
  divider2: '#ddd', border: '#ccc',
} as any;

const mockTr = {
  labels: { stepLabel: 'Step' },
} as any;

beforeEach(() => {
  useThemeStore.setState({ theme: mockTheme, resolvedTheme: 'light' as any });
  useLanguageStore.setState({ tr: mockTr, language: 'en' as any });
});

describe('AbdesiScreen', () => {
  it('renders the header title', () => {
    render(<AbdesiScreen />);
    expect(screen.getByText('Performing Wudu')).toBeTruthy();
  });

  it('renders all 10 step numbers', () => {
    render(<AbdesiScreen />);
    for (let i = 1; i <= 10; i++) {
      expect(screen.getByText(String(i))).toBeTruthy();
    }
  });

  it('renders the progress indicator starting at step 1', () => {
    render(<AbdesiScreen />);
    expect(screen.getByText('Step 1 / 10')).toBeTruthy();
  });

  it('renders first step instruction text', () => {
    render(<AbdesiScreen />);
    expect(
      screen.getByText(/Make your intention.*Bismillah/s)
    ).toBeTruthy();
  });

  it('opens the image viewer when a step image is tapped', () => {
    render(<AbdesiScreen />);
    // Viewer closed initially
    expect(screen.queryByTestId('image-viewer-close')).toBeNull();
    // Step 2 is the first step with an image
    const images = screen.UNSAFE_getAllByType(Image);
    fireEvent.press(images[0]);
    expect(screen.getByTestId('image-viewer-close')).toBeTruthy();
  });
});
