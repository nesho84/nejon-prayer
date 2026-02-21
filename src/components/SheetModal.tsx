import { useThemeStore } from '@/store/themeStore';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { Animated, PanResponder, StyleSheet, TouchableOpacity, useWindowDimensions, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SheetModalProps = {
  children: React.ReactNode;
  modalHeight?: `${number}%`;
  onClose?: () => void;
  disableClose?: boolean;
  style?: ViewStyle;
};

const DEFAULT_MODAL_HEIGHT = '99%';

export default function SheetModal({ children, modalHeight, onClose, disableClose, style }: SheetModalProps) {
  const router = useRouter();
  const theme = useThemeStore((state) => state.theme);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const screenHeightRef = useRef(height);
  const translateY = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // ------------------------------------------------------------
  // Fade in on mount after slide animation completes
  // ------------------------------------------------------------
  useFocusEffect(
    useCallback(() => {
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 200,
        delay: 450,
        useNativeDriver: true,
      }).start();
    }, [])
  );

  // ------------------------------------------------------------
  // Handle close with animation
  // ------------------------------------------------------------
  const handleClose = () => {
    Animated.timing(backdropOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      onClose?.();
      router.back();
    });
  };

  // ------------------------------------------------------------
  // Update screen height on dimension change
  // ------------------------------------------------------------
  useEffect(() => {
    screenHeightRef.current = height;
  }, [height]);

  // ------------------------------------------------------------
  // PanResponder for drag-down to close
  // ------------------------------------------------------------
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dy }) => !disableClose && dy > 10,
      onPanResponderMove: (_, { dy }) => {
        if (dy > 0 && !disableClose) translateY.setValue(dy);
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        if (disableClose) {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
          return;
        }
        if (dy > screenHeightRef.current / 3 || vy > 1) {
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: screenHeightRef.current,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onClose?.();
            router.back();
          });
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  return (
    <View style={[
      styles.container,
      {
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }
    ]}
    >
      {/* Backdrop fades in separately */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: 'rgba(0,0,0,0.4)', opacity: backdropOpacity }
        ]}
        pointerEvents="none"
      />

      {/* Tap backdrop to close */}
      <TouchableOpacity
        style={StyleSheet.absoluteFillObject}
        onPress={disableClose ? undefined : handleClose}
        activeOpacity={1}
      />

      <Animated.View
        style={[
          styles.contentContainer,
          {
            backgroundColor: theme.bg2,
            transform: [{ translateY: translateY }],
            maxHeight: modalHeight || DEFAULT_MODAL_HEIGHT,
          },
          style,
        ]}
      >
        {/* Drag Handle */}
        <View style={styles.header} {...panResponder.panHandlers}>
          <View style={[styles.handle, { backgroundColor: theme.placeholder }]} />
        </View>

        {/* Content */}
        {children}

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  contentContainer: {
    flex: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },

  header: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    opacity: 0.4,
  },
});