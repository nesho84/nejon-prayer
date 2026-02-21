import { useThemeStore } from '@/store/themeStore';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, PanResponder, StyleSheet, TouchableOpacity, useWindowDimensions, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SheetModalProps = {
  children: React.ReactNode;
  modalHeight?: `${number}%`;
  onClose?: () => void;
  disableClose?: boolean;
  style?: ViewStyle;
};

const DEFAULT_MODAL_HEIGHT = '95%';

export default function SheetModal({ children, modalHeight, onClose, disableClose, style }: SheetModalProps) {
  const router = useRouter();
  const theme = useThemeStore((state) => state.theme);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const screenHeightRef = useRef(height);
  const translateY = useRef(new Animated.Value(0)).current;

  // ------------------------------------------------------------
  // Handle close with animation
  // ------------------------------------------------------------
  const handleClose = () => {
    onClose?.();
    router.back();
  };

  // ------------------------------------------------------------
  // Animate backdrop in on mount
  // ------------------------------------------------------------
  useEffect(() => {
    Animated.timing(backdropOpacity, {
      toValue: 1,
      duration: 200,
      delay: 500,
      useNativeDriver: true,
    }).start();
  }, []);

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
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => handleClose());
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  return (
    <View style={styles.modalOverlay}>
      {/* Backdrop fades in separately */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: 'rgba(0,0,0,0.4)', opacity: backdropOpacity }
        ]}
        pointerEvents="none"
      />

      {/* Backdrop - tap to close */}
      <TouchableOpacity
        style={StyleSheet.absoluteFillObject}
        onPress={disableClose ? undefined : handleClose}
        activeOpacity={1}
      />

      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: theme.bg2,
            paddingBottom: insets.bottom || 8,
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
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