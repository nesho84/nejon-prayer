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
  size?: ModalSheetSize;
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
// Size
// ------------------------------------------------------------
type ModalSheetSize = 'xs' | 'sm' | 'smd' | 'md' | 'mdl' | 'lg' | 'lgx' | 'xl' | 'xlx' | 'xxl' | 'xxlf' | 'full';

const SIZES_MAP: Record<ModalSheetSize, number> = {
  xs: 0.20,   // extra small — action strips, minimal pickers
  sm: 0.28,   // small — quick actions, simple confirmations
  smd: 0.36,  // small-medium — short forms, brief info cards
  md: 0.45,   // medium — most common, forms, lists
  mdl: 0.52,  // medium-large — longer forms, grouped settings
  lg: 0.58,   // large — tall lists, multi-section content
  lgx: 0.64,  // large-extra — tall forms, detailed views
  xl: 0.70,   // extra large — complex screens, long settings
  xlx: 0.76,  // extra large-plus — near full, heavy content
  xxl: 0.82,  // double extra large — almost full, rich content
  xxlf: 0.90, // double extra large-full — just below full screen
  full: 0.99, // full screen — immersive, default
};

// ------------------------------------------------------------
// Defaults
// ------------------------------------------------------------
const SHEET_BACKGROUND = '#fafafa';
const HEADER_BAR_BORDER_COLOR = 'rgba(128, 128, 128, 0.2)';
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

  const sheetMaxHeight = height * SIZES_MAP[size];

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
  // Delays backdrop fade-in to sync with the navigator slide animation
  // ------------------------------------------------------------
  useEffect(() => {
    const t = setTimeout(() => {
      backdropOpacity.value = withTiming(1, { duration: ANIMATION_DURATION });
    }, BACKDROP_DELAY);
    return () => clearTimeout(t);
  }, []);

  // ------------------------------------------------------------
  // Android hardware back button — blocked silently in staticMode
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
  // Keyboard handling — offsets content so inputs stay visible
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

    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  // ------------------------------------------------------------
  // Drag gesture — threshold relative to sheet height, not screen
  // ------------------------------------------------------------
  const gesture = Gesture.Pan()
    .enabled(!staticMode)
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
  // Drives the sheet vertical position on the UI thread
  // ------------------------------------------------------------
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // ------------------------------------------------------------
  // Drives the backdrop opacity on the UI thread
  // ------------------------------------------------------------
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  // ------------------------------------------------------------
  // Keyboard offset applied to content area only
  // ------------------------------------------------------------
  const keyboardStyle = useAnimatedStyle(() => ({
    paddingBottom: Math.max(0, keyboardHeight.value - insets.bottom - 24),
  }));

  return (
    <View style={styles.root}>

      {/* Dimmed backdrop — fades in after sheet is fully visible */}
      <Animated.View
        style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.4)' }, backdropStyle]}
        pointerEvents="none"
      />

      <Animated.View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
          animatedStyle,
        ]}
      >

        {/* Backdrop tap to dismiss */}
        {!staticMode && (
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={animatedClose}
          />
        )}

        {/* Clips content to rounded corners */}
        <View style={[
          styles.innerContainer,
          {
            backgroundColor: colors?.sheetBackgroundColor ?? SHEET_BACKGROUND,
            maxHeight: sheetMaxHeight,
          }
        ]}>

          {/* Draggable header bar — handle pill + optional close icon */}
          <GestureDetector gesture={gesture}>
            <View style={[styles.headerBarContainer, { borderBottomColor: HEADER_BAR_BORDER_COLOR }]}>
              <View style={[styles.handleIcon, { backgroundColor: colors?.handleColor ?? HANDLE_COLOR }]} />
              {!staticMode && closeIcon && (
                <Pressable onPress={animatedClose} style={styles.closeIcon} hitSlop={12}>
                  <Ionicons name='close' size={24} color={colors?.closeIconColor ?? CLOSE_ICON_COLOR} />
                </Pressable>
              )}
            </View>
          </GestureDetector>

          {/* Optional fixed header slot */}
          {header && <View>{header}</View>}

          {/* Scrollable or static content — keyboard padding lives here */}
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

          {/* Optional fixed footer slot */}
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
    paddingTop: 12,
    paddingBottom: 14,
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