import { globalStyles, HIT_SLOP_8 } from "@/constants/styles";
import { SUPPORTER_TR, SupporterTranslations } from "@/constants/translations/supporter.tr";
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

interface Props {
  variant: "banner" | "card"; // banner: Home ad slot, after the ad's X; card: Extras, Feedback
  onOpen?: () => void;        // runs before opening the support screen (e.g. close the popup it sits in)
  style?: ViewStyle;
}

// ------------------------------------------------------------
// Card description: thanks for supporters, the pitch otherwise
// ------------------------------------------------------------
function getCardBody(isSupporter: boolean, supporterTr: SupporterTranslations) {
  if (isSupporter) {
    return supporterTr.moreSupporterBody;
  }
  return supporterTr.moreBody;
}

// Support the app — one look for every place it appears (Android only for now)
export default function SupporterBanner({ variant, onOpen, style }: Props) {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const language = useLanguageStore((state) => state.language);
  const adBannerDismissed = useAdsStore((state) => state.bannerDismissed);
  const isSupporter = useSupporterStore((state) => state.isSupporter);
  const bannerVisible = useSupporterStore((state) => state.bannerVisible);
  const supporterTr = SUPPORTER_TR[language] ?? SUPPORTER_TR.en;

  // DEBUG: force-show the banner, and fake the supporter state on cards (Debug Panel toggles)
  const debugModeEnabled = useDebugStore((state) => state.debugModeEnabled);
  const forceBanner = useDebugStore((state) => state.forceSupporterBanner);
  const supporterPreview = useDebugStore((state) => state.supporterPreview);

  // Same side insets as the ad banner
  const insets = useSafeAreaInsets();

  // Banner: show on the ad banner's X, hide when the ad banner comes back
  useEffect(() => {
    if (variant !== "banner" || Platform.OS !== "android") {
      return;
    }
    if (adBannerDismissed) {
      useSupporterStore.getState().showBanner();
    } else {
      useSupporterStore.getState().hideBanner();
    }
  }, [variant, adBannerDismissed]);

  if (Platform.OS !== "android") {
    return null;
  }

  const boxColors = { backgroundColor: theme.bgGold, borderColor: theme.borderGold };

  const openSupporterScreen = () => {
    onOpen?.();
    router.navigate("/extras/supporter");
  };

  // Banner: Home ad slot — 60dp, one line, X
  if (variant === "banner") {
    // A debug preview shows it regardless; supporters never see it
    if (!(debugModeEnabled && forceBanner) && (!bannerVisible || isSupporter)) {
      return null;
    }

    // The X also ends a debug preview, so it closes like the real banner
    const closeBanner = () => {
      useSupporterStore.getState().hideBanner();
      if (forceBanner) {
        useDebugStore.getState().toggleSupporterBanner();
      }
    };

    return (
      <View style={[styles.banner, boxColors, { paddingLeft: insets.left + 12, paddingRight: insets.right }, style]}>
        <Pressable
          style={({ pressed }) => [styles.bannerContent, { opacity: pressed ? 0.7 : 1 }]}
          onPress={openSupporterScreen}
        >
          <View style={[styles.bannerIcon, { backgroundColor: theme.accentLight, borderColor: theme.divider2 }]}>
            <MaterialDesignIcons name="heart-outline" size={20} color={theme.accent} />
          </View>
          <View style={styles.bannerText}>
            <Text style={[styles.bannerTitle, { color: theme.text }]} numberOfLines={1}>{supporterTr.title}</Text>
            <Text style={[styles.bannerBody, { color: theme.textSecondary }]} numberOfLines={1}>{supporterTr.bannerBody}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.text2} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [globalStyles.iconButton, styles.closeButton, pressed && { backgroundColor: theme.pressed }]}
          onPress={closeBanner}
          accessibilityRole="button"
          accessibilityLabel={supporterTr.closeBanner}
          hitSlop={HIT_SLOP_8}
        >
          <Ionicons name="close" size={18} color={theme.text2} />
        </Pressable>
      </View>
    );
  }

  // Card: Extras and Feedback — long description, supporter badge
  const shownSupporter = debugModeEnabled && supporterPreview !== "idle" ? supporterPreview === "supporter" : isSupporter;

  return (
    <View style={[styles.card, boxColors, style]}>
      <Pressable
        style={({ pressed }) => [styles.cardContent, { opacity: pressed ? 0.7 : 1 }]}
        android_ripple={{ color: theme.overlayLight, borderless: false }}
        onPress={openSupporterScreen}
      >
        {shownSupporter ? (
          <View style={[styles.cardIcon, { backgroundColor: theme.success + "1F", borderColor: theme.divider2 }]}>
            <MaterialDesignIcons name="check-decagram" size={32} color={theme.success} />
            <Text style={[styles.badgeText, { color: theme.success }]} numberOfLines={1} adjustsFontSizeToFit>
              {supporterTr.supporterBadge}
            </Text>
          </View>
        ) : (
          <View style={[styles.cardIcon, { backgroundColor: theme.accentLight, borderColor: theme.divider2 }]}>
            <MaterialDesignIcons name="heart-outline" size={28} color={theme.accent} />
          </View>
        )}
        <View style={styles.cardText}>
          <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>{supporterTr.title}</Text>
          <Text style={[styles.cardBody, { color: theme.textSecondary }]} numberOfLines={2}>
            {getCardBody(shownSupporter, supporterTr)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.text2} />
      </Pressable>
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
