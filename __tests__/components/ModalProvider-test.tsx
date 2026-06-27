import ModalProvider from '@/components/ModalProvider';
import { useModalStore } from '@/store/modalStore';
import { useThemeStore } from '@/store/themeStore';
import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
// ModalProvider transitively imports CelebrationFx → reanimated, whose worklets
// runtime can't initialise under Jest. Stub it to passthrough Animated.* views.
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
jest.mock('@react-native-vector-icons/ionicons/static', () => {
  const React = require('react');
  return {
    Ionicons: ({ name }: { name: string }) =>
      React.createElement('View', { testID: `icon-${name}` }),
  };
});

const mockTheme = {
  bg2: '#ffffff', black: '#000', text: '#111', text2: '#555', card: '#eee',
};

beforeEach(() => {
  useThemeStore.setState({ theme: mockTheme as any });
  useModalStore.setState({ visible: false, options: null } as any);
});

describe('ModalProvider', () => {
  it('renders nothing when not visible and no options', () => {
    const { toJSON } = render(<ModalProvider />);
    expect(toJSON()).toBeNull();
  });

  it('renders alert modal with title and content', () => {
    useModalStore.setState({
      visible: true,
      options: { type: 'alert', title: 'Hello', content: 'World' },
    } as any);
    render(<ModalProvider />);
    expect(screen.getByText('Hello')).toBeTruthy();
    expect(screen.getByText('World')).toBeTruthy();
  });

  it('calls hide when a button is pressed', () => {
    const onPress = jest.fn();
    const hide = jest.fn();
    useModalStore.setState({
      visible: true,
      options: {
        type: 'alert',
        title: 'Confirm',
        buttons: [{ action: 'ok', label: 'OK', onPress }],
      },
      hide,
    } as any);
    render(<ModalProvider />);
    fireEvent.press(screen.getByText('OK'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(hide).toHaveBeenCalledWith('ok');
  });
});
