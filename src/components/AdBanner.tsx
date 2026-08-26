import { HIT_SLOP_8 } from "@/constants/styles";
import { useAdsStore } from "@/store/adsStore";
import { useThemeStore } from "@/store/themeStore";
import { Ionicons } from "@react-native-vector-icons/ionicons/static";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";

// TestIds while testing — clicking a live ad from your own device gets the AdMob account
// suspended. No iOS ad unit is registered yet, so iOS stays on the test unit too.
const BANNER_UNIT_ID =
  __DEV__ || Platform.OS === "ios"
    ? TestIds.BANNER
    : "ca-app-pub-8752479739166396/7743991128";

export default function AdBanner() {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const canRequestAds = useAdsStore((state) => state.canRequestAds);

  // Local state — dismissal is per-session only, never persisted
  const [dismissed, setDismissed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!canRequestAds || dismissed) return null;

  return (
    // Styled only once loaded, so nothing is reserved while the request is in flight
    <View style={loaded ? [styles.container, { backgroundColor: theme.bg, borderTopColor: theme.border }] : undefined}>
      {loaded && (
        // Absolute, so it adds no height — sits in the gap beside the 320dp ad, never over it
        <Pressable
          onPress={() => setDismissed(true)}
          hitSlop={HIT_SLOP_8}
          style={({ pressed }) => [styles.closeButton, pressed && { backgroundColor: theme.pressed }]}
        >
          <Ionicons name="close" size={14} color={theme.placeholder} />
        </Pressable>
      )}

      <BannerAd
        unitId={BANNER_UNIT_ID}
        size={BannerAdSize.BANNER}
        onAdLoaded={() => setLoaded(true)}
        onAdFailedToLoad={(err) => {
          console.warn("⚠️ [AdBanner] Failed to load banner:", err);
          setLoaded(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  closeButton: {
    position: "absolute",
    top: 2,
    right: 4,
    zIndex: 1,
    padding: 2,
    borderRadius: 999,
  },
});
