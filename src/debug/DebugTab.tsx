import { globalStyles } from "@/constants/styles";
import { useDebugStore } from "@/debug/debugStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import { useThemeStore } from "@/store/themeStore";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons/static";
import { router, usePathname, useSegments } from "expo-router";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Below a native stack header, so it never sits beside header buttons
const HEADER_HEIGHT = 56;
const TAB_GAP = 8;

// Edge tab that opens the debug sheet from any screen — debug mode only
export default function DebugTab() {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const debugModeEnabled = useDebugStore((state) => state.debugModeEnabled);
  const onboardingComplete = useOnboardingStore((state) => state.onboardingComplete);

  // Router
  const pathname = usePathname();
  const segments = useSegments();

  // Safe area insets
  const insets = useSafeAreaInsets();

  // The sheet is a protected route — no tab before onboarding
  if (!debugModeEnabled || !onboardingComplete) {
    return null;
  }

  // ------------------------------------------------------------
  // Same tab opens and closes the sheet; replaces another open sheet so two never overlap
  // ------------------------------------------------------------
  const toggleSheet = () => {
    if (pathname === "/debugTools") {
      router.back();
      return;
    }
    if (segments[0] === "(modals)") {
      router.replace("/(modals)/debugTools");
      return;
    }
    router.navigate("/(modals)/debugTools");
  };

  return (
    <TouchableOpacity
      style={[
        styles.tab,
        globalStyles.cardShadow,
        { top: insets.top + HEADER_HEIGHT + TAB_GAP, right: insets.right, backgroundColor: theme.card2, borderColor: theme.border },
      ]}
      onPress={toggleSheet}
      activeOpacity={0.6}
      hitSlop={{ top: 6, bottom: 6, left: 24, right: 0 }}
      accessibilityRole="button"
      accessibilityLabel="Debug tools"
    >
      <MaterialDesignIcons name="wrench" size={16} color={theme.danger} style={styles.icon} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Flush with the right edge, no right border; paddingLeft centers the icon optically
  tab: {
    position: "absolute",
    width: 28,
    height: 38,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    borderWidth: 1,
    borderRightWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 2,
  },
  icon: {
    opacity: 0.9,
  },
});
