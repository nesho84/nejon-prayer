import { useThemeStore } from '@/store/themeStore';
import { useRouter } from 'expo-router';
import { forwardRef, useCallback, useEffect, useImperativeHandle } from 'react';
import { StyleSheet, TouchableOpacity, useWindowDimensions, View, ViewStyle } from 'react-native';
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

const DEFAULT_MODAL_HEIGHT = '99%';

const SheetModal = forwardRef<SheetModalRef, Props>(({ children, modalHeight, onClose, staticMode, style }, ref) => {
  const router = useRouter();
  const theme = useThemeStore((state) => state.theme);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const translateY = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const context = useSharedValue({ y: 0 });

  // ------------------------------------------------------------
  // Expose close method to parent via ref
  // ------------------------------------------------------------
  useImperativeHandle(ref, () => ({
    close: () => {
      backdropOpacity.value = withTiming(0, { duration: 200 }, () => {
        scheduleOnRN(handleClose);
      });
    },
  }));

  // ------------------------------------------------------------
  // Handle close with animation
  // ------------------------------------------------------------
  const handleClose = useCallback(() => {
    onClose?.();
    router.back();
  }, [onClose]);

  // ------------------------------------------------------------
  // small delay to let slide animation finish
  // ------------------------------------------------------------
  useEffect(() => {
    const t = setTimeout(() => {
      backdropOpacity.value = withTiming(1, { duration: 200 });
    }, 500);
    return () => clearTimeout(t);
  }, []);

  // ------------------------------------------------------------
  // PanResponder for drag-down to close
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
        translateY.value = withTiming(height, { duration: 200 });
        backdropOpacity.value = withTiming(0, { duration: 200 }, () => {
          scheduleOnRN(handleClose);
        });
      } else {
        // snap back
        translateY.value = withSpring(0, { damping: 100 });
      }
    });

  // ------------------------------------------------------------
  // Animated styles
  // ------------------------------------------------------------
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // ------------------------------------------------------------
  // Backdrop animated style
  // ------------------------------------------------------------
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

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
        onPress={staticMode ? undefined : handleClose}
        activeOpacity={1}
      />

      {/* Sheet */}
      <Animated.View
        style={[
          styles.content,
          {
            backgroundColor: theme.bg2,
            maxHeight: modalHeight || DEFAULT_MODAL_HEIGHT,
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
    paddingBottom: 16,
  },
  handle: {
    width: 75,
    height: 4,
    alignSelf: 'center',
    borderRadius: 2,
  },
});