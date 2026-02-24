import { useRouter } from 'expo-router';
import { forwardRef, useCallback, useEffect, useImperativeHandle } from 'react';
import {
  BackHandler,
  Keyboard,
  Platform,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ViewStyle
} from 'react-native';
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

interface Props {
  children: React.ReactNode;
  modalHeight?: number | `${number}%`;
  staticMode?: boolean;
  scrolling?: boolean;
  onClose?: () => void;
  style?: ViewStyle;
};

export type ModalSheetRef = {
  close: () => void;
};

const ANIMATION_DURATION = 200;
const SNAP_BACK_DURATION = 100;
const HANDLE_COLOR = '#80868b';

const ModalSheet = forwardRef<ModalSheetRef, Props>(({
  children,
  modalHeight,
  staticMode,
  scrolling,
  onClose,
  style
}, ref) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const translateY = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const context = useSharedValue({ y: 0 });
  const keyboardHeight = useSharedValue(0);

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

    translateY.value = withTiming(height, { duration: ANIMATION_DURATION });
    backdropOpacity.value = withTiming(0, { duration: ANIMATION_DURATION }, (finished) => {
      if (finished) {
        scheduleOnRN(handleClose);
      }
    });
  }, [height, staticMode, handleClose]);

  // ------------------------------------------------------------
  // Allows parent components to trigger close via ref
  // ------------------------------------------------------------
  useImperativeHandle(ref, () => ({
    close: () => {
      if (staticMode) {
        console.warn('ModalSheet: close() called in staticMode');
        return;
      }
      animatedClose();
    }
  }), [animatedClose]);

  // ------------------------------------------------------------
  // Delays backdrop fade-in to sync with the navigator slide animation
  // ------------------------------------------------------------
  useEffect(() => {
    const t = setTimeout(() => {
      backdropOpacity.value = withTiming(1, { duration: ANIMATION_DURATION });
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
  // Listens to keyboard show/hide events to adjust the sheet position
  // ------------------------------------------------------------
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: any) => {
      const kbHeight = e.endCoordinates.height;
      keyboardHeight.value = withTiming(kbHeight, { duration: 350 });
    };
    const onHide = (e: any) => {
      keyboardHeight.value = withTiming(0, { duration: 250 });
    };
    const subShow = Keyboard.addListener(showEvent, onShow);
    const subHide = Keyboard.addListener(hideEvent, onHide);

    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

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
        translateY.value = withTiming(height, { duration: ANIMATION_DURATION });
        backdropOpacity.value = withTiming(0, { duration: ANIMATION_DURATION }, (finished) => {
          if (finished) scheduleOnRN(handleClose);
        });
      } else {
        // snap back
        translateY.value = withTiming(0, { duration: SNAP_BACK_DURATION });
      }
    });

  // ------------------------------------------------------------
  // Calculates the animated style for the sheet based on keyboard and drag position
  // ------------------------------------------------------------
  const animatedStyle = useAnimatedStyle(() => {
    const resolvedMaxHeight =
      typeof modalHeight === 'string'
        ? (parseFloat(modalHeight) / 100) * height
        : modalHeight ?? height * 0.99;

    const safeHeight = height - insets.top - insets.bottom;
    const spaceAboveSheet = safeHeight - resolvedMaxHeight;
    const upward = Math.min(keyboardHeight.value, Math.max(spaceAboveSheet, 0));
    const heightReduction = keyboardHeight.value - upward;

    return {
      transform: [{ translateY: translateY.value - upward }],
      maxHeight: resolvedMaxHeight - heightReduction,
    };
  });

  // ------------------------------------------------------------
  // Drives the backdrop opacity on the UI thread
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
        onPress={animatedClose}
        activeOpacity={0}
      />

      {/* Sheet */}
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.content, animatedStyle, style]}>
          {/* Drag Handle */}
          <View style={styles.header}>
            <View style={[styles.handle, { backgroundColor: HANDLE_COLOR }]} />
          </View>

          {/* Content */}
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            scrollEnabled={scrolling ?? true}
            bounces={false}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>

        </Animated.View>
      </GestureDetector>

    </Animated.View>
  );
});

export default ModalSheet;

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
    paddingBottom: 22,
  },
  handle: {
    width: 75,
    height: 4,
    alignSelf: 'center',
    borderRadius: 2,
  },
});