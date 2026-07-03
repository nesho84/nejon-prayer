import ImageViewer from '@/components/ImageViewer';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Image } from 'react-native';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Reanimated 4's worklets runtime can't initialise under Jest, so stub the
// bits ImageViewer uses down to plain values / a passthrough Animated.View.
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

// Stub gesture-handler: chainable builders + passthrough wrappers, so the
// component tree renders without the native gesture system.
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');
  const builder = () => {
    const chain: Record<string, () => typeof chain> = {};
    ['onUpdate', 'onEnd', 'numberOfTaps'].forEach((m) => {
      chain[m] = () => chain;
    });
    return chain;
  };
  return {
    Gesture: {
      Pinch: builder,
      Pan: builder,
      Tap: builder,
      Simultaneous: () => ({}),
    },
    GestureDetector: ({ children }: { children: React.ReactNode }) => children,
    GestureHandlerRootView: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

const source = { uri: 'step.png' };

describe('ImageViewer', () => {
  it('renders nothing when source is null', () => {
    const { toJSON } = render(
      <ImageViewer visible source={null} onClose={jest.fn()} />
    );
    expect(toJSON()).toBeNull();
  });

  it('renders the image when a source is provided', () => {
    render(<ImageViewer visible source={source} onClose={jest.fn()} />);
    const images = screen.UNSAFE_getAllByType(Image);
    expect(images[0].props.source).toEqual(source);
  });

  it('calls onClose when the close button is pressed', () => {
    const onClose = jest.fn();
    render(<ImageViewer visible source={source} onClose={onClose} />);
    fireEvent.press(screen.getByTestId('image-viewer-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
