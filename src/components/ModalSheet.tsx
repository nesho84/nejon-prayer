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
const HEADER_BAR_BORDER_COLOR = '#37383a';
const HANDLE_COLOR = '#80868b';
const CLOSE_ICON_COLOR = '#80868b';

const ModalSheet = forwardRef<ModalSheetRef, Props>(({
  children,
  style,
  colors = {},
  staticMode,
  scrolling = true,
  closeIcon = false,
  header,
  footer,
  onClose
}, ref) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const translateY = useSharedValue(0);
  const context = useSharedValue({ y: 0 });
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
    translateY.value = withTiming(height, { duration: ANIMATION_DURATION }, (finished) => {
      if (finished) scheduleOnRN(handleClose);
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
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      const newY = event.translationY + context.value.y;
      if (newY > 0) translateY.value = newY; // only allow dragging down
    })
    .onEnd((event) => {
      if (event.translationY > height / 2 || event.velocityY > 1000) {
        // Past midpoint or fast flick → close
        translateY.value = withTiming(height, { duration: ANIMATION_DURATION }, (finished) => {
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

  // Keyboard offset applied to content area only, not the whole modal
  const keyboardStyle = useAnimatedStyle(() => ({
    // insets.bottom is added to content padding, subtract it here to avoid double-padding when keyboard is open
    paddingBottom: Math.max(0, keyboardHeight.value - insets.bottom),
  }));

  return (
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
      {/* Sheet — rounded top corners + overflow clipping */}
      <View style={[styles.innerContainer, style, { backgroundColor: colors.sheetBackgroundColor ?? SHEET_BACKGROUND }]}>

        {/* Draggable header: handle pill + title/close row */}
        <GestureDetector gesture={gesture}>
          <View style={[styles.headerBarContainer, { borderBottomColor: colors.headerBarBorderColor ?? HEADER_BAR_BORDER_COLOR }]}>
            {/* Drag handle pill */}
            <View style={[styles.handleIcon, { backgroundColor: colors.handleColor ?? HANDLE_COLOR }]} />

            {/* Close icon/button */}
            {!staticMode && closeIcon && (
              <Pressable onPress={animatedClose} style={styles.closeIcon} hitSlop={12}>
                <Ionicons name='close' size={22} color={colors.closeIconColor ?? CLOSE_ICON_COLOR} />
              </Pressable>
            )}
          </View>
        </GestureDetector>

        {/* Optional fixed header slot (unchanged from original) */}
        {header && <View>{header}</View>}

        {/* Scrollable/static content — keyboard padding lives here */}
        <Animated.View style={[styles.content, keyboardStyle]}>
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
  );
});

export default ModalSheet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },

  headerBarContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 22,
  },
  handleIcon: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  closeIcon: {
    position: 'absolute',
    top: 8,
    right: 16,
  },

  content: {
    flex: 1,
  },
});