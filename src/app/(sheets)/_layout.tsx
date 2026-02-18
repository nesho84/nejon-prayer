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

const DEFAULT_SNAP_POINTS = ['50%', '75%', '100%'];

export default function SheetLayout() {
  const router = useRouter();
  const params = useLocalSearchParams<SheetParams>();
  const sheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const theme = useThemeStore((state) => state.theme);

  const { height } = useWindowDimensions();

  const snapPoints = useMemo(() => {
    if (!params.snapPoints) return DEFAULT_SNAP_POINTS;
    try {
      return JSON.parse(params.snapPoints);
    } catch {
      return DEFAULT_SNAP_POINTS;
    }
  }, [params.snapPoints]);

  const largestSnapPoint = parseFloat(snapPoints[snapPoints.length - 1]) / 100;
  const sheetHandleHeight = 24; // gorhom's default handle height

  const initialIndex = useMemo(() => {
    return params.initialIndex ? Number(params.initialIndex) : 0;
  }, [params.initialIndex]);

  const enablePanDownToClose = useMemo(() => {
    return params.enablePanDownToClose === "false" ? false : true;
  }, [params.enablePanDownToClose]);

  useEffect(() => {
    sheetRef.current?.snapToIndex(initialIndex);
  }, [initialIndex, snapPoints]);

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
        height: (height * largestSnapPoint) - insets.top - sheetHandleHeight,
        paddingBottom: insets.bottom || 8,
      }}>
        <Slot />
      </View>
    </BottomSheet>
  );
}