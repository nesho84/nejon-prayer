import { useThemeStore } from '@/store/themeStore';
import { useRouter } from 'expo-router';
import { forwardRef, useCallback, useEffect, useImperativeHandle } from 'react';
import { BackHandler, StyleSheet, TouchableOpacity, useWindowDimensions, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

interface Props {
  children: React.ReactNode;
  modalHeight?: `${number}%`;
  onClose?: () => void;
  staticMode?: boolean;
  style?: ViewStyle;
};

export type SheetModalRef = {
  close: () => void;
};

const DEFAULT_HEIGHT = '99%';
const DEFAULT_DURATION = 200;
const DEFAULT_DAMPING = 200;

const SheetModal = forwardRef<SheetModalRef, Props>(({ children, modalHeight, onClose, staticMode, style }, ref) => {
  const router = useRouter();
  const theme = useThemeStore((state) => state.theme);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const translateY = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const context = useSharedValue({ y: 0 });

  // ------------------------------------------------------------
  // Navigates back in the stack and runs any cleanup logic
  // ------------------------------------------------------------
  const handleClose = useCallback(() => {
    onClose?.();
    router.back();
  }, [onClose, router]);

  // ------------------------------------------------------------
  // Slides the sheet off screen and fades the backdrop before closing
  // ------------------------------------------------------------
  const animatedClose = useCallback(() => {
    if (staticMode) return;

    translateY.value = withTiming(height, { duration: DEFAULT_DURATION });
    backdropOpacity.value = withTiming(0, { duration: DEFAULT_DURATION }, (finished) => {
      if (finished) {
        scheduleOnRN(handleClose);
      }
    });
  }, [height, staticMode, handleClose]);

  // ------------------------------------------------------------
  // Allows parent components to trigger close via ref
  // ------------------------------------------------------------
  useImperativeHandle(ref, () => ({
    close: animatedClose,
  }));

  // ------------------------------------------------------------
  // Delays backdrop fade-in to sync with the navigator slide animation
  // ------------------------------------------------------------
  useEffect(() => {
    const t = setTimeout(() => {
      backdropOpacity.value = withTiming(1, { duration: DEFAULT_DURATION });
    }, 600); // 600ms to match the slide_from_bottom animation
    return () => clearTimeout(t);
  }, []);

  // ------------------------------------------------------------
  // Overrides the Android hardware back button with animated close
  // ------------------------------------------------------------
  useEffect(() => {
    const onBackPress = () => {
      animatedClose();
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => subscription.remove();
  }, [animatedClose]);

  // ------------------------------------------------------------
  // Tracks drag position and closes or snaps back based on threshold
  // ------------------------------------------------------------
  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      if (staticMode) return;
      const newY = event.translationY + context.value.y;
      // only allow dragging down
      if (newY > 0) translateY.value = newY;
    })
    .onEnd((event) => {
      if (staticMode) {
        translateY.value = withSpring(0);
        return;
      }
      if (event.translationY > height / 3 || event.velocityY > 1000) {
        // close
        translateY.value = withTiming(height, { duration: DEFAULT_DURATION });
        backdropOpacity.value = withTiming(0, { duration: DEFAULT_DURATION }, (finished) => {
          if (finished) scheduleOnRN(handleClose);
        });
      } else {
        // snap back
        translateY.value = withSpring(0, { damping: DEFAULT_DAMPING });
      }
    });

  // ------------------------------------------------------------
  // Drives the sheet vertical position on the UI thread
  // ------------------------------------------------------------
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // ------------------------------------------------------------
  // Drives the backdrop opacity on the UI thread
  // ------------------------------------------------------------
  const backdropStyle = useAnimatedStyle(() => {
    const progress = backdropOpacity.value;
    return { opacity: progress };
  });

  // Main Content
  return (
    <Animated.View style={[
      styles.container,
      {
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }
    ]}
    >

      {/* Backdrop */}
      <Animated.View
        style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.4)' }, backdropStyle]}
        pointerEvents="none"
      />
      {/* Tap Backdrop to close */}
      <TouchableOpacity
        style={StyleSheet.absoluteFillObject}
        onPress={animatedClose}
        activeOpacity={0}
      />

      {/* Sheet */}
      <Animated.View
        style={[
          styles.content,
          {
            backgroundColor: theme.bg2,
            maxHeight: modalHeight || DEFAULT_HEIGHT,
          },
          animatedStyle,
          style,
        ]}
      >

        {/* Drag Handle */}
        <GestureDetector gesture={gesture}>
          <View style={styles.header}>
            <View style={[styles.handle, { backgroundColor: theme.placeholder }]} />
          </View>
        </GestureDetector>

        {/* Content */}
        {children}
      </Animated.View>

    </Animated.View>
  );
});

export default SheetModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    flex: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 18,
  },
  handle: {
    width: 75,
    height: 4,
    alignSelf: 'center',
    borderRadius: 2,
  },
});