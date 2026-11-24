import { HIT_SLOP_8 } from "@/constants/styles";
import { SUPPORTER_TR } from "@/constants/translations/supporter.tr";
import { useDebugStore } from "@/debug/debugStore";
import { useAdsStore } from "@/store/adsStore";
import { useLanguageStore } from "@/store/languageStore";
import { useSupporterStore } from "@/store/supporterStore";
import { useThemeStore } from "@/store/themeStore";
import { Ionicons } from "@react-native-vector-icons/ionicons/static";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons/static";
import { router } from "expo-router";
import { useEffect } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Takes the ad banner's slot after its X, never taller than the ad banner
export default function SupporterBanner() {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const language = useLanguageStore((state) => state.language);
  const adBannerDismissed = useAdsStore((state) => state.bannerDismissed);
  const isSupporter = useSupporterStore((state) => state.isSupporter);
  const bannerVisible = useSupporterStore((state) => state.bannerVisible);
  const debugModeEnabled = useDebugStore((state) => state.debugModeEnabled);
  const forceBanner = useDebugStore((state) => state.forceSupporterBanner);

  const supporterTr = SUPPORTER_TR[language] ?? SUPPORTER_TR.en;

  // Same side insets as the ad banner
  const insets = useSafeAreaInsets();

  // Show on the ad banner's X, hide when the ad banner comes back
  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }
    if (adBannerDismissed) {
      useSupporterStore.getState().showBannerIfDue();
    } else {
      useSupporterStore.getState().hideBanner();
    }
  }, [adBannerDismissed]);

  // A debug preview shows it regardless
  if (!(debugModeEnabled && forceBanner) && (!bannerVisible || isSupporter)) {
    return null;
  }

  const openSupporterScreen = () => {
    useSupporterStore.getState().hideBanner();
    router.navigate("/extras/supporter");
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: resolvedTheme === "dark" ? theme.bg2 : theme.white,
          borderColor: theme.gold + '73',
          paddingLeft: insets.left + 12,
          paddingRight: insets.right,
        },
      ]}
    >
      <TouchableOpacity style={styles.content} onPress={openSupporterScreen} activeOpacity={0.6}>
        <View style={[styles.iconSquare, { backgroundColor: theme.accentLight, borderColor: theme.divider2 }]}>
          <MaterialDesignIcons name="advertisements-off" size={20} color={theme.accent} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{supporterTr.title}</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]} numberOfLines={1}>{supporterTr.bannerBody}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.text2} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => useSupporterStore.getState().hideBanner()}
        accessibilityRole="button"
        accessibilityLabel={supporterTr.closeBanner}
        hitSlop={HIT_SLOP_8}
        activeOpacity={0.6}
      >
        <Ionicons name="close" size={18} color={theme.text2} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // AdBanner's box is up to 66dp (60dp ad + 3dp padding each side)
  container: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
  },
  content: {
    flex: 1,
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconSquare: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    gap: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
  },
  body: {
    fontSize: 12,
  },
  closeButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
});
