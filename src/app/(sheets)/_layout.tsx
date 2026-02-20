import { useThemeStore } from '@/store/themeStore';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Slot, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SheetParams = {
  snapPoints?: string;
  initialIndex?: string;
};

const DEFAULT_SNAP_POINTS = ['100%'];

export default function SheetLayout() {
  const router = useRouter();
  const params = useLocalSearchParams<SheetParams>();
  const sheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const theme = useThemeStore((state) => state.theme);

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
  // Parse initialIndex
  // ------------------------------------------------------------
  const initialIndex = useMemo(() => {
    return params.initialIndex ? Number(params.initialIndex) : 0;
  }, [params.initialIndex]);

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
      bottomInset={insets.bottom}
      enablePanDownToClose={true}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      enableBlurKeyboardOnGesture={true}
      backdropComponent={renderBackdrop}
      onClose={() => router.back()}
      backgroundStyle={{ backgroundColor: theme.bg2 }}
      handleIndicatorStyle={{ backgroundColor: theme.placeholder }}
    >
      <Slot />
    </BottomSheet>
  );
}