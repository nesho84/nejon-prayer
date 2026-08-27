import { HIT_SLOP_8 } from "@/constants/styles";
import { useAdsStore } from "@/store/adsStore";
import { useThemeStore } from "@/store/themeStore";
import NetInfo from "@react-native-community/netinfo";
import { Ionicons } from "@react-native-vector-icons/ionicons/static";
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";

// Live ad units — no iOS app is registered in AdMob yet, so iOS holds the test unit until one is.
const ANDROID_BANNER_UNIT_ID = "ca-app-pub-8752479739166396/7743991128";
const IOS_BANNER_UNIT_ID = TestIds.BANNER;

const PLATFORM_BANNER_UNIT_ID = Platform.OS === "android" ? ANDROID_BANNER_UNIT_ID : IOS_BANNER_UNIT_ID;

// TestIds in dev — clicking a live ad from your own device risks the AdMob account.
const BANNER_UNIT_ID = __DEV__ ? TestIds.BANNER : PLATFORM_BANNER_UNIT_ID;

// Connectivity changes settle for this long before acting on them, so a flapping signal
// doesn't repeatedly retry the ad. The first reading skips it — a cold start that is
// already online shouldn't wait.
const CONNECTIVITY_DEBOUNCE_MS = 2500;

export default function AdBanner() {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const canRequestAds = useAdsStore((state) => state.canRequestAds);

  // Local state — dismissal is per-session only, never persisted
  const [dismissed, setDismissed] = useState(false);
  // One-way latch: once an ad has rendered we never collapse again, so a failed *refresh*
  // can't hide an ad the native view is still showing.
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  // Debounced connectivity — null until the first NetInfo reading arrives
  const [online, setOnline] = useState<boolean | null>(null);
  // One-way latch: gates only the *start* of rendering. Going offline later never unmounts.
  const [shouldRenderBannerAd, setShouldRenderBannerAd] = useState(false);

  const bannerRef = useRef<BannerAd>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstNetInfoEventRef = useRef(true);
  const prevOnlineRef = useRef<boolean | null>(null);
  const wasMountedRef = useRef(false);

  // ------------------------------------------------------------
  // Track connectivity, debounced
  // ------------------------------------------------------------
  useEffect(() => {
    const commit = (nowOnline: boolean) => {
      setOnline(nowOnline);
      // Mounting the native view issues the first request on its own. This never reverts —
      // dropping offline later must not unmount the ad.
      if (nowOnline) setShouldRenderBannerAd(true);
    };

    const unsubscribe = NetInfo.addEventListener((state) => {
      // isInternetReachable is null while the reachability probe runs, so only treat the
      // device as offline on positive evidence. Mapping null to false would misread a normal
      // online cold start as offline and delay the first request by a whole debounce window.
      const nowOnline = state.isConnected === true && state.isInternetReachable !== false;

      // The first callback carries the current state — apply it straight away
      if (isFirstNetInfoEventRef.current) {
        isFirstNetInfoEventRef.current = false;
        commit(nowOnline);
        return;
      }

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        commit(nowOnline);
      }, CONNECTIVITY_DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // ------------------------------------------------------------
  // Force a retry when connectivity returns before anything ever filled
  // ------------------------------------------------------------
  useEffect(() => {
    const prevOnline = prevOnlineRef.current;
    const wasMounted = wasMountedRef.current;
    prevOnlineRef.current = online;
    wasMountedRef.current = shouldRenderBannerAd;

    if (online !== true || hasLoadedOnce) return;

    // Only retry a banner that was already on screen. A first mount issues its own request,
    // and refs are attached before effects run — without this guard the reconnect that
    // mounts the banner would fire a second request for the same slot.
    if (prevOnline === false && wasMounted) bannerRef.current?.load();
  }, [online, hasLoadedOnce, shouldRenderBannerAd]);

  if (!canRequestAds || dismissed) return null;

  return (
    // Collapsed to zero height until an ad has actually rendered — the native banner paints
    // its own background at a fixed 320x50, so unstyling the wrapper is not enough to hide it.
    <View
      testID="ad-banner-container"
      style={[
        styles.container,
        { backgroundColor: theme.bg, borderTopColor: theme.border },
        !hasLoadedOnce && styles.collapsed,
      ]}
    >
      {hasLoadedOnce && (
        // Absolute, so it adds no height — sits in the gap beside the 320dp ad, never over it
        <Pressable
          onPress={() => setDismissed(true)}
          hitSlop={HIT_SLOP_8}
          style={({ pressed }) => [styles.closeButton, pressed && { backgroundColor: theme.pressed }]}
        >
          <Ionicons name="close" size={14} color={theme.placeholder} />
        </Pressable>
      )}

      {shouldRenderBannerAd && (
        <BannerAd
          ref={bannerRef}
          unitId={BANNER_UNIT_ID}
          size={BannerAdSize.BANNER}
          onAdLoaded={() => setHasLoadedOnce(true)}
          onAdFailedToLoad={(err) => {
            // hasLoadedOnce is deliberately untouched — a failed refresh must not hide an
            // ad that is still on screen, and a failed first load is already collapsed.
            if (online === false) return; // expected while offline, not worth logging
            console.warn("⚠️ [AdBanner] Failed to load banner:", err);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  collapsed: {
    height: 0,
    borderTopWidth: 0,
    overflow: "hidden",
    // opacity is belt-and-braces: the banner is a native view that paints its own background,
    // and clipping alone can't be trusted to contain it. Safe because nothing has loaded yet,
    // so no impression is being hidden.
    opacity: 0,
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
