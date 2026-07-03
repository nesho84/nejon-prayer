import CelebrationFx from '@/components/CelebrationFx';
import { useThemeStore } from '@/store/themeStore';
import { render, screen } from '@testing-library/react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));

// Reanimated 4's worklets runtime can't initialise under Jest, so stub the
// bits CelebrationFx uses down to plain values / passthrough Animated.* views.
jest.mock('react-native-reanimated', () => {
  const { View, Text } = require('react-native');
  const passthrough = () => 0;
  return {
    __esModule: true,
    default: { View, Text },
    useSharedValue: (value: number) => ({ value }),
    useAnimatedStyle: () => ({}),
    withTiming: (value: number) => value,
    withDelay: (_delay: number, value: number) => value,
    withSequence: (...values: number[]) => values[values.length - 1],
    Easing: { out: () => passthrough, in: () => passthrough, linear: passthrough, quad: passthrough, cubic: passthrough },
  };
});

const mockTheme = { gold: '#d1a127', islamicGreen: '#009000', accent: '#d97706', text2: '#374151' };

beforeEach(() => {
  useThemeStore.setState({ theme: mockTheme as any });
});

describe('CelebrationFx', () => {
  it('renders the sparkle glyphs for the sparkle variant', () => {
    render(<CelebrationFx variant="sparkle" />);
    // 10 sparkles alternating between the two glyphs → 5 each
    expect(screen.getAllByText('✨')).toHaveLength(5);
    expect(screen.getAllByText('⭐')).toHaveLength(5);
  });

  it('renders the rain variant without crashing', () => {
    const { toJSON } = render(<CelebrationFx variant="rain" />);
    expect(toJSON()).toBeTruthy();
    // rain dots carry no text
    expect(screen.queryByText('✨')).toBeNull();
  });

  it('renders the burst variant without crashing', () => {
    const { toJSON } = render(<CelebrationFx variant="burst" />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders the rise variant without crashing', () => {
    const { toJSON } = render(<CelebrationFx variant="rise" />);
    expect(toJSON()).toBeTruthy();
    // rise bubbles carry no text
    expect(screen.queryByText('✨')).toBeNull();
  });

  it('renders a valid variant when none is provided', () => {
    const { toJSON } = render(<CelebrationFx />);
    expect(toJSON()).toBeTruthy();
  });
});
