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

// ------------------------------------------------------------
// Props
// ------------------------------------------------------------
type ModalSheetSize = 'xs' | 'sm' | 'smd' | 'md' | 'mdl' | 'lg' | 'lgx' | 'xl' | 'xlx' | 'xxl' | 'xxlf' | 'full';

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
  size?: ModalSheetSize | number;
  scrolling?: boolean;
  closeIcon?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  onClose?: () => void;
}

export type ModalSheetRef = {
  close: () => void;
};

// ------------------------------------------------------------
// Size map — screen height ratios
// ------------------------------------------------------------
const SIZES_MAP: Record<ModalSheetSize, number> = {
  xs: 0.20,
  sm: 0.28,
  smd: 0.36,
  md: 0.45,
  mdl: 0.52,
  lg: 0.58,
  lgx: 0.64,
  xl: 0.70,
  xlx: 0.76,
  xxl: 0.82,
  xxlf: 0.90,
  full: 0.99,
};

// ------------------------------------------------------------
// Constants
// ------------------------------------------------------------
const SHEET_BACKGROUND = '#fafafa';
const HEADER_BAR_BORDER_COLOR = 'rgba(128, 128, 128, 0.12)';
const HANDLE_COLOR = '#5D5D5D';
const CLOSE_ICON_COLOR = '#5D5D5D';

const ANIMATION_DURATION = 250;
const BACKDROP_DELAY = 500;
const SNAP_BACK_DURATION = 150;

const ModalSheet = forwardRef<ModalSheetRef, Props>(({
  children,
  style,
  colors,
  staticMode,
  size = 'full',
  scrolling = true,
  closeIcon,
  header,
  footer,
  onClose
}, ref) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const sheetMaxHeight = typeof size === 'number'
    ? height * Math.min(Math.max(size, 0.1), 1)
    : height * SIZES_MAP[size ?? 'full'];

  const translateY = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const keyboardHeight = useSharedValue(0);

  // ------------------------------------------------------------
  // Navigate back and run optional cleanup
  // ------------------------------------------------------------
  const handleClose = useCallback(() => {
    onClose?.();
    router.back();
  }, [onClose, router]);

  // ------------------------------------------------------------
  // Animate sheet off screen then navigate back
  // ------------------------------------------------------------
  const animatedClose = useCallback(() => {
    translateY.value = withTiming(height, { duration: ANIMATION_DURATION });
    backdropOpacity.value = withTiming(0, { duration: ANIMATION_DURATION }, (finished) => {
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
    },
  }), [animatedClose, staticMode]);

  // ------------------------------------------------------------
  // Fade in backdrop after navigator slide animation completes
  // ------------------------------------------------------------
  useEffect(() => {
    const t = setTimeout(() => {
      backdropOpacity.value = withTiming(1, { duration: ANIMATION_DURATION });
    }, BACKDROP_DELAY);
    return () => clearTimeout(t);
  }, []);

  // ------------------------------------------------------------
  // Android hardware back — silent no-op in staticMode
  // ------------------------------------------------------------
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (staticMode) return true;
      animatedClose();
      return true;
    });
    return () => subscription.remove();
  }, [animatedClose, staticMode]);

  // ------------------------------------------------------------
  // Keyboard — shift sheet up so focused inputs stay visible
  // ------------------------------------------------------------
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: any) => keyboardHeight.value = withTiming(e.endCoordinates.height, { duration: 300 });
    const onHide = () => keyboardHeight.value = withTiming(0, { duration: 250 });

    const subShow = Keyboard.addListener(showEvent, onShow);
    const subHide = Keyboard.addListener(hideEvent, onHide);

    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  // ------------------------------------------------------------
  // Pan gesture — drag down to dismiss, snap back otherwise
  // ------------------------------------------------------------
  const gesture = Gesture.Pan()
    .enabled(!staticMode)
    .activeOffsetY([-10, 10])
    .onUpdate((event) => {
      if (event.translationY > 0) translateY.value = event.translationY;
    })
    .onEnd((event) => {
      if (event.translationY > sheetMaxHeight / 2 || event.velocityY > 1000) {
        translateY.value = withTiming(height, { duration: ANIMATION_DURATION });
        backdropOpacity.value = withTiming(0, { duration: ANIMATION_DURATION }, (finished) => {
          if (finished) scheduleOnRN(handleClose);
        });
      } else {
        translateY.value = withTiming(0, { duration: SNAP_BACK_DURATION });
      }
    });

  // ------------------------------------------------------------
  // Sheet position — drag offset minus keyboard upward shift
  // ------------------------------------------------------------
  const animatedStyle = useAnimatedStyle(() => {
    const safeHeight = height - insets.top - insets.bottom;
    const spaceAbove = safeHeight - sheetMaxHeight;
    const upward = Math.min(keyboardHeight.value, Math.max(spaceAbove, 0));

    return {
      transform: [{ translateY: translateY.value - upward }],
    };
  });

  // ------------------------------------------------------------
  // Backdrop opacity
  // ------------------------------------------------------------
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  return (
    <View style={styles.root}>

      {/* Dimmed backdrop — pointer events disabled, tap handled by Pressable below */}
      <Animated.View
        style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.4)' }, backdropStyle]}
        pointerEvents="none"
      />

      <Animated.View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
          animatedStyle,
        ]}
      >

        {/* Tap outside sheet to dismiss */}
        {!staticMode && (
          <Pressable style={StyleSheet.absoluteFillObject} onPress={animatedClose} />
        )}

        <GestureDetector gesture={gesture}>
          <Animated.View style={[
            styles.innerContainer,
            {
              backgroundColor: colors?.sheetBackgroundColor ?? SHEET_BACKGROUND,
              paddingBottom: insets.bottom,
              maxHeight: sheetMaxHeight,
            }
          ]}>

            {/* Handle bar — drag target + optional close icon */}
            <View style={[styles.headerBarContainer, { borderBottomColor: colors?.headerBarBorderColor ?? HEADER_BAR_BORDER_COLOR }]}>
              <View style={[styles.handleIcon, { backgroundColor: colors?.handleColor ?? HANDLE_COLOR }]} />
              {!staticMode && closeIcon && (
                <Pressable onPress={animatedClose} style={styles.closeIcon} hitSlop={12}>
                  <Ionicons name="close" size={24} color={colors?.closeIconColor ?? CLOSE_ICON_COLOR} />
                </Pressable>
              )}
            </View>

            {/* Fixed header */}
            {header && <View>{header}</View>}

            {/* Content area — scrollable or static */}
            <View style={[styles.content, style]}>
              {scrolling ? (
                <ScrollView
                  contentContainerStyle={{ flexGrow: 1 }}
                  bounces={false}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {children}
                </ScrollView>
              ) : (
                children
              )}
            </View>

            {/* Fixed footer */}
            {footer && <View>{footer}</View>}

          </Animated.View>
        </GestureDetector>

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
    justifyContent: 'flex-end',
  },
  innerContainer: {
    flex: 1,
    flexShrink: 1,
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
    paddingVertical: 12,
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