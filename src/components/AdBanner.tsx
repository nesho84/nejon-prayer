import { BANNER_UNIT_ID, CONNECTIVITY_DEBOUNCE_MS } from "@/constants/ads";
import { HIT_SLOP_8 } from "@/constants/styles";
import { useAdsStore } from "@/store/adsStore";
import { useThemeStore } from "@/store/themeStore";
import NetInfo from "@react-native-community/netinfo";
import { Ionicons } from "@react-native-vector-icons/ionicons/static";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";

export default function AdBanner() {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const canRequestAds = useAdsStore((state) => state.canRequestAds);

  // Load/dismiss state lives in the store. bannerLoaded is a one-way latch, so a failed
  // refresh never collapses a visible ad.
  const loaded = useAdsStore((state) => state.bannerLoaded);
  const dismissed = useAdsStore((state) => state.bannerDismissed);
  const markBannerLoaded = useAdsStore((state) => state.markBannerLoaded);
  const dismissBanner = useAdsStore((state) => state.dismissBanner);

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

    if (online !== true || loaded) return;

    // Only retry a banner that was already on screen. A first mount issues its own request,
    // and refs are attached before effects run — without this guard the reconnect that
    // mounts the banner would fire a second request for the same slot.
    if (prevOnline === false && wasMounted) bannerRef.current?.load();
  }, [online, loaded, shouldRenderBannerAd]);

  if (!canRequestAds || dismissed) return null;

  return (
    // Collapsed to zero height until an ad has actually rendered — the native banner paints
    // its own background at a fixed 320x50, so unstyling the wrapper is not enough to hide it.
    <View
      testID="ad-banner-container"
      style={[
        styles.container,
        { backgroundColor: theme.bg, borderTopColor: theme.border },
        !loaded && styles.collapsed,
      ]}
    >
      {loaded && (
        // Absolute, so it adds no height — sits in the gap beside the 320dp ad, never over it
        <Pressable
          onPress={dismissBanner}
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
          onAdLoaded={markBannerLoaded}
          onAdFailedToLoad={(err) => {
            // bannerLoaded is deliberately untouched — a failed refresh must not hide an
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
