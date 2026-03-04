import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { forwardRef, useCallback, useEffect, useImperativeHandle } from 'react';
import {
  BackHandler,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle
} from 'react-native';
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

interface Colors {
  sheetBackgroundColor?: string;
  headerBarBorderColor?: string;
  handleColor?: string;
  closeIconColor?: string;
}

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  colors?: Colors;
  staticMode?: boolean;
  scrolling?: boolean;
  closeIcon?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  onClose?: () => void;
}

export type ModalSheetRef = {
  close: () => void;
};

const ANIMATION_DURATION = 250;
const SNAP_BACK_DURATION = 150;

const SHEET_BACKGROUND = '#fafafa';
const HEADER_BAR_BORDER_COLOR = 'transparent';
const HANDLE_COLOR = '#5D5D5D';
const CLOSE_ICON_COLOR = '#5D5D5D';

const ModalSheet = forwardRef<ModalSheetRef, Props>(({
  children,
  style,
  colors,
  staticMode,
  scrolling = true,
  closeIcon,
  header,
  footer,
  onClose
}, ref) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const translateY = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const keyboardHeight = useSharedValue(0);

  // ------------------------------------------------------------
  // Navigate back and run cleanup
  // ------------------------------------------------------------
  const handleClose = useCallback(() => {
    onClose?.();
    router.back();
  }, [onClose, router]);

  // ------------------------------------------------------------
  // Animate sheet off screen then close
  // ------------------------------------------------------------
  const animatedClose = useCallback(() => {
    translateY.value = withTiming(height, { duration: ANIMATION_DURATION });
    backdropOpacity.value = withTiming(0, { duration: ANIMATION_DURATION }, (finished) => {
      if (finished) {
        scheduleOnRN(handleClose);
      }
    });
  }, [height, handleClose]);

  // ------------------------------------------------------------
  // Expose close() to parent via ref
  // ------------------------------------------------------------
  useImperativeHandle(ref, () => ({
    close: () => {
      if (staticMode) {
        console.warn('ModalSheet: close() called in staticMode');
        return;
      }
      animatedClose();
    }
  }), [animatedClose, staticMode]);

  // ------------------------------------------------------------
  // Delays backdrop fade-in to sync with the navigator slide animation
  // ------------------------------------------------------------
  useEffect(() => {
    const t = setTimeout(() => {
      backdropOpacity.value = withTiming(1, { duration: ANIMATION_DURATION });
    }, 550); // Delay to match the slide_from_bottom animation
    return () => clearTimeout(t);
  }, []);

  // ------------------------------------------------------------
  // Android hardware back button — blocked silently in staticMode
  // ------------------------------------------------------------
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (staticMode) return true; // consume event, do nothing
      animatedClose();
      return true;
    });
    return () => subscription.remove();
  }, [animatedClose, staticMode]);

  // ------------------------------------------------------------
  // Keyboard handling.
  // Add paddingBottom to the content area so inputs near
  // the bottom aren't hidden behind the keyboard.
  // ------------------------------------------------------------
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: any) => {
      keyboardHeight.value = withTiming(e.endCoordinates.height, { duration: 300 });
    };
    const onHide = () => {
      keyboardHeight.value = withTiming(0, { duration: 250 });
    };

    const subShow = Keyboard.addListener(showEvent, onShow);
    const subHide = Keyboard.addListener(hideEvent, onHide);
    return () => { subShow.remove(); subHide.remove(); };
  }, []);

  // ------------------------------------------------------------
  // Drag gesture — header only, completely disabled in staticMode
  // ------------------------------------------------------------
  const gesture = Gesture.Pan()
    .enabled(!staticMode)
    .onUpdate((event) => {
      // only allow dragging down
      if (event.translationY > 0) translateY.value = event.translationY;
    })
    .onEnd((event) => {
      if (event.translationY > height / 2 || event.velocityY > 1000) {
        // Past midpoint or fast flick → close
        translateY.value = withTiming(height, { duration: ANIMATION_DURATION });
        backdropOpacity.value = withTiming(0, { duration: ANIMATION_DURATION }, (finished) => {
          if (finished) scheduleOnRN(handleClose);
        });
      } else {
        // Above midpoint → snap back to top
        translateY.value = withTiming(0, { duration: SNAP_BACK_DURATION });
      }
    });

  // Sheet drag translation only
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Drives the backdrop opacity on the UI thread
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  // Keyboard offset applied to content area only, not the whole modal
  const keyboardStyle = useAnimatedStyle(() => ({
    // insets.bottom is added to content padding, subtract it here to avoid double-padding when keyboard is open
    paddingBottom: Math.max(0, keyboardHeight.value - insets.bottom),
  }));

  return (
    <View style={styles.root}>

      {/* Backdrop */}
      <Animated.View
        style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.4)' }, backdropStyle]}
        pointerEvents="none"
      />

      <Animated.View
        style={[
          styles.container,
          {
            paddingTop: insets.top + 12, // easier to grab the handle
            paddingBottom: insets.bottom,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
          animatedStyle,
        ]}
      >

        {/* Inner: clips content to rounded corners */}
        <View style={[styles.innerContainer, { backgroundColor: colors?.sheetBackgroundColor ?? SHEET_BACKGROUND }]}>

          {/* Draggable header: handle pill + title/close row */}
          <GestureDetector gesture={gesture}>
            <View style={[styles.headerBarContainer, { borderBottomColor: colors?.headerBarBorderColor ?? HEADER_BAR_BORDER_COLOR }]}>
              {/* Drag handle pill */}
              <View style={[styles.handleIcon, { backgroundColor: colors?.handleColor ?? HANDLE_COLOR }]} />

              {/* Optional: Close icon/button */}
              {!staticMode && closeIcon && (
                <Pressable onPress={animatedClose} style={styles.closeIcon} hitSlop={12}>
                  <Ionicons name='close' size={24} color={colors?.closeIconColor ?? CLOSE_ICON_COLOR} />
                </Pressable>
              )}
            </View>
          </GestureDetector>

          {/* Optional fixed header slot (unchanged from original) */}
          {header && <View>{header}</View>}

          {/* Scrollable/static content — keyboard padding lives here */}
          <Animated.View style={[styles.content, style, keyboardStyle]}>
            {scrolling ? (
              <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
                bounces={false}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
              >
                {children}
              </ScrollView>
            ) : (
              children
            )}
          </Animated.View>

          {/* Optional fixed footer slot (unchanged from original) */}
          {footer && <View>{footer}</View>}

        </View>
      </Animated.View>

    </View>
  );
});

export default ModalSheet;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: 'hidden',
    shadowColor: '#121212',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 12,
  },

  headerBarContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 16,
  },
  handleIcon: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  closeIcon: {
    position: 'absolute',
    top: 2,
    right: 16,
  },

  content: {
    flex: 1,
  },
});