import { useThemeStore } from '@/store/themeStore';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Slot, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SheetParams = {
  snapPoints?: string;
  initialIndex?: string;
  enablePanDownToClose?: string;
};

const DEFAULT_SNAP_POINTS = ['100%'];

export default function SheetLayout() {
  const router = useRouter();
  const params = useLocalSearchParams<SheetParams>();
  const sheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const theme = useThemeStore((state) => state.theme);

  // Get window height for dynamic snap point calculations
  const { height: windowHeight } = useWindowDimensions();
  const HANDLE_HEIGHT = 24;

  // ------------------------------------------------------------
  // Parse snap points from params or use default
  // ------------------------------------------------------------
  const snapPoints = useMemo(() => {
    if (!params.snapPoints) return DEFAULT_SNAP_POINTS;
    try {
      return JSON.parse(params.snapPoints);
    } catch {
      return DEFAULT_SNAP_POINTS;
    }
  }, [params.snapPoints]);

  // ------------------------------------------------------------
  // Compute the inner content height based on the largest snap point.
  // gorhom uses (containerHeight - topInset) as the available space for percentage snap points.
  // For pixel snap points, the raw value is used (clamped to available space).
  // ------------------------------------------------------------
  const innerHeight = useMemo(() => {
    const lastSnap = String(snapPoints[snapPoints.length - 1]);
    const availableHeight = windowHeight - insets.top;
    let sheetHeight: number;

    if (lastSnap.endsWith('%')) {
      sheetHeight = availableHeight * (parseFloat(lastSnap) / 100);
    } else {
      sheetHeight = Math.min(parseFloat(lastSnap), availableHeight);
    }

    return sheetHeight - HANDLE_HEIGHT;
  }, [snapPoints, windowHeight, insets.top]);

  // ------------------------------------------------------------
  // Parse initial index
  // ------------------------------------------------------------
  const initialIndex = useMemo(() => {
    return params.initialIndex ? Number(params.initialIndex) : 0;
  }, [params.initialIndex]);

  // ------------------------------------------------------------
  // Parse enablePanDownToClose (default true)
  // ------------------------------------------------------------
  const enablePanDownToClose = useMemo(() => {
    return params.enablePanDownToClose === "false" ? false : true;
  }, [params.enablePanDownToClose]);

  // ------------------------------------------------------------
  // Snap to initial index on mount or when snap points change
  // ------------------------------------------------------------
  useEffect(() => {
    sheetRef.current?.snapToIndex(initialIndex);
  }, [initialIndex, snapPoints]);

  // ------------------------------------------------------------
  // Backdrop component with custom opacity and close on press
  // ------------------------------------------------------------
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        opacity={0.4}
      />
    ), []);

  return (
    <BottomSheet
      ref={sheetRef}
      index={initialIndex}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      topInset={insets.top}
      enablePanDownToClose={enablePanDownToClose}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      enableBlurKeyboardOnGesture={true}
      backdropComponent={renderBackdrop}
      onClose={() => router.back()}
      backgroundStyle={{ backgroundColor: theme.bg2 }}
      handleIndicatorStyle={{ backgroundColor: theme.placeholder }}
    >
      <View style={{
        height: innerHeight,
        paddingBottom: insets.bottom || 8,
      }}>
        <Slot />
      </View>
    </BottomSheet>
  );
}