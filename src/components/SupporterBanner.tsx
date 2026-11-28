import { globalStyles, HIT_SLOP_8 } from "@/constants/styles";
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
import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SupporterBannerProps {
  // "banner": Home ad slot (60dp, X, shows after the ad's X). "card": Extras, Feedback
  variant: "banner" | "card";
  // Runs before opening the support screen (e.g. close the popup it sits in)
  onOpen?: () => void;
  style?: ViewStyle;
}

// ------------------------------------------------------------
// Support the app — one look for every place it appears (Android only for now)
// ------------------------------------------------------------
export default function SupporterBanner({ variant, onOpen, style }: SupporterBannerProps) {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const language = useLanguageStore((state) => state.language);
  const adBannerDismissed = useAdsStore((state) => state.bannerDismissed);
  const isSupporter = useSupporterStore((state) => state.isSupporter);
  const bannerVisible = useSupporterStore((state) => state.bannerVisible);
  const debugModeEnabled = useDebugStore((state) => state.debugModeEnabled);
  const forceBanner = useDebugStore((state) => state.forceSupporterBanner);
  const supporterPreview = useDebugStore((state) => state.supporterPreview);

  const supporterTr = SUPPORTER_TR[language] ?? SUPPORTER_TR.en;
  const isBanner = variant === "banner";

  // Same side insets as the ad banner
  const insets = useSafeAreaInsets();

  // Banner: show on the ad banner's X, hide when the ad banner comes back
  useEffect(() => {
    if (!isBanner || Platform.OS !== "android") {
      return;
    }
    if (adBannerDismissed) {
      useSupporterStore.getState().showBanner();
    } else {
      useSupporterStore.getState().hideBanner();
    }
  }, [isBanner, adBannerDismissed]);

  if (Platform.OS !== "android") {
    return null;
  }
  // Banner: a debug preview shows it regardless; supporters never see it
  if (isBanner && !(debugModeEnabled && forceBanner) && (!bannerVisible || isSupporter)) {
    return null;
  }

  // Card: the debug supporter preview can fake the supporter state
  const shownSupporter = debugModeEnabled && supporterPreview !== "idle" ? supporterPreview === "supporter" : isSupporter;

  const openSupporterScreen = () => {
    onOpen?.();
    router.navigate("/extras/supporter");
  };

  // The X also ends a debug preview, so it closes like the real banner
  const closeBanner = () => {
    useSupporterStore.getState().hideBanner();
    if (forceBanner) {
      useDebugStore.getState().toggleSupporterBanner();
    }
  };

  // Icon square: green supporter badge on cards, heart otherwise
  const icon = !isBanner && shownSupporter ? (
    <View style={[styles.cardIcon, { backgroundColor: theme.success + "1F", borderColor: theme.divider2 }]}>
      <MaterialDesignIcons name="check-decagram" size={32} color={theme.success} />
      <Text style={[styles.badgeText, { color: theme.success }]} numberOfLines={1} adjustsFontSizeToFit>
        {supporterTr.supporterBadge}
      </Text>
    </View>
  ) : (
    <View style={[isBanner ? styles.bannerIcon : styles.cardIcon, { backgroundColor: theme.accentLight, borderColor: theme.divider2 }]}>
      <MaterialDesignIcons name="heart-outline" size={isBanner ? 20 : 28} color={theme.accent} />
    </View>
  );

  const body = isBanner ? supporterTr.bannerBody : shownSupporter ? supporterTr.moreSupporterBody : supporterTr.moreBody;

  return (
    <View
      style={[
        isBanner ? styles.banner : styles.card,
        { backgroundColor: theme.bgGold, borderColor: theme.borderGold },
        isBanner && { paddingLeft: insets.left + 12, paddingRight: insets.right },
        style,
      ]}
    >
      <Pressable
        style={({ pressed }) => [isBanner ? styles.bannerContent : styles.cardContent, { opacity: pressed ? 0.7 : 1 }]}
        android_ripple={isBanner ? undefined : { color: theme.overlayLight, borderless: false }}
        onPress={openSupporterScreen}
      >
        {icon}
        <View style={isBanner ? styles.bannerText : styles.cardText}>
          <Text style={[isBanner ? styles.bannerTitle : styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
            {supporterTr.title}
          </Text>
          <Text style={[isBanner ? styles.bannerBody : styles.cardBody, { color: theme.textSecondary }]} numberOfLines={isBanner ? 1 : 2}>
            {body}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={isBanner ? 18 : 20} color={theme.text2} />
      </Pressable>

      {isBanner && (
        <Pressable
          style={({ pressed }) => [globalStyles.iconButton, styles.closeButton, pressed && { backgroundColor: theme.pressed }]}
          onPress={closeBanner}
          accessibilityRole="button"
          accessibilityLabel={supporterTr.closeBanner}
          hitSlop={HIT_SLOP_8}
        >
          <Ionicons name="close" size={18} color={theme.text2} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Banner — fills the ad banner's slot: never taller than its 66dp box
  banner: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
  },
  bannerContent: {
    flex: 1,
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerText: {
    flex: 1,
    gap: 3.5,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: "600",
    includeFontPadding: false,
  },
  bannerBody: {
    fontSize: 12,
    includeFontPadding: false,
  },
  // 34dp pressed circle + 7dp each side keeps the old 48dp slot
  closeButton: {
    marginHorizontal: 7,
  },

  // Card — Extras and Feedback
  card: {
    borderWidth: 1.5,
    borderRadius: 16,
    overflow: "hidden",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    includeFontPadding: false,
    marginTop: 1,
    marginBottom: 2,
    paddingHorizontal: 3,
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "600",
    includeFontPadding: false,
  },
  cardBody: {
    fontSize: 14,
    opacity: 0.7,
    includeFontPadding: false,
  },
});
