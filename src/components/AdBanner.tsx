import {
  BANNER_CLOSE_DELAY_MS,
  BANNER_DISMISS_RESET_MS,
  BANNER_UNIT_ID,
  CONNECTIVITY_DEBOUNCE_MS,
} from "@/constants/ads";
import { HIT_SLOP_8 } from "@/constants/styles";
import { useAdsStore } from "@/store/adsStore";
import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import NetInfo from "@react-native-community/netinfo";
import { Ionicons } from "@react-native-vector-icons/ionicons/static";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { BannerAd, BannerAdSize, useForeground } from "react-native-google-mobile-ads";

// Space between the ad and the box's edges, the same on every side
const PANEL_PADDING = 3;
// Fixed tab height, so the tab can be placed exactly on the box's top line
const TAB_HEIGHT = 19;
// Caps the adaptive height near the old banner's, instead of large anchored's 50–150dp
const BANNER_MAX_HEIGHT = 60;

export default function AdBanner() {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const tr = useLanguageStore((state) => state.tr);
  const canRequestAds = useAdsStore((state) => state.canRequestAds);

  // The ad fills the panel's inner width
  const { width } = useWindowDimensions();

  // Load/dismiss state lives in the store. bannerLoaded is a one-way latch, so a failed
  // refresh never collapses a visible ad.
  const loaded = useAdsStore((state) => state.bannerLoaded);
  const dismissed = useAdsStore((state) => state.bannerDismissed);
  const dismissedAt = useAdsStore((state) => state.bannerDismissedAt);
  const markBannerLoaded = useAdsStore((state) => state.markBannerLoaded);
  const dismissBanner = useAdsStore((state) => state.dismissBanner);
  const restoreBanner = useAdsStore((state) => state.restoreBanner);

  // Debounced connectivity — null until the first NetInfo reading arrives
  const [online, setOnline] = useState<boolean | null>(null);
  // One-way latch: gates only the *start* of rendering. Going offline later never unmounts.
  const [shouldRenderBannerAd, setShouldRenderBannerAd] = useState(false);
  // Close button waits BANNER_CLOSE_DELAY_MS after the first ad instead of popping in with it
  const [showClose, setShowClose] = useState(false);

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

  // On resume: a dismissal older than BANNER_DISMISS_RESET_MS ends — the banner remounts and
  // requests a fresh ad, and the close button waits its delay again. Otherwise reload, since
  // the ad's WebView can be reclaimed while the app is suspended.
  useForeground(() => {
    if (dismissedAt !== null && Date.now() - dismissedAt >= BANNER_DISMISS_RESET_MS) {
      setShowClose(false);
      restoreBanner();
      return;
    }
    bannerRef.current?.load();
  });

  // Reveal the close button once the first ad has been on screen for a moment
  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => setShowClose(true), BANNER_CLOSE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [loaded]);

  if (!canRequestAds || dismissed) return null;

  return (
    // Collapsed to zero height until an ad has actually rendered — the native banner paints
    // its own background, so unstyling the wrapper is not enough to hide it.
    <View
      testID="ad-banner-container"
      style={[
        styles.container,
        { backgroundColor: theme.bg, borderTopColor: theme.border },
        !loaded && styles.collapsed,
      ]}
    >
      {shouldRenderBannerAd && (
        <BannerAd
          ref={bannerRef}
          unitId={BANNER_UNIT_ID}
          size={BannerAdSize.INLINE_ADAPTIVE_BANNER}
          width={width - PANEL_PADDING * 2}
          maxHeight={BANNER_MAX_HEIGHT}
          onAdLoaded={markBannerLoaded}
          onAdFailedToLoad={(err) => {
            // bannerLoaded is deliberately untouched — a failed refresh must not hide an
            // ad that is still on screen, and a failed first load is already collapsed.
            if (online === false) return; // expected while offline, not worth logging
            console.warn("⚠️ [AdBanner] Failed to load banner:", err);
          }}
        />
      )}

      {showClose && (
        // A tab rising from the box's top line, same colour as the box. It sits above the ad,
        // never over it; no bottom hitSlop so it can't take taps from the ad.
        <TouchableOpacity
          style={[styles.closeTab, { backgroundColor: theme.bg, borderColor: theme.border }]}
          onPress={dismissBanner}
          accessibilityRole="button"
          accessibilityLabel={tr.labels.closeAd}
          hitSlop={{ ...HIT_SLOP_8, bottom: 0 }}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={16} color={theme.text2} style={styles.closeIcon} />
          {/* Hides the box line under the tab. Sits between the side borders, so it never
              touches the corners; extra height falls on the box's own background.
              pointerEvents none keeps the tap area above the line, away from the ad. */}
          <View pointerEvents="none" style={[styles.lineCover, { backgroundColor: theme.bg }]} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: PANEL_PADDING,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  collapsed: {
    height: 0,
    paddingVertical: 0,
    borderTopWidth: 0,
    overflow: "hidden",
    // opacity is belt-and-braces: the banner is a native view that paints its own background,
    // and clipping alone can't be trusted to contain it. Safe because nothing has loaded yet,
    // so no impression is being hidden.
    opacity: 0,
  },
  // Tab above the box's top-right corner, outlined top and sides only, so the box line runs
  // up and around it
  closeTab: {
    position: "absolute",
    // Ends exactly on the box line, so the side borders stop flush with it
    top: -TAB_HEIGHT,
    right: PANEL_PADDING,
    zIndex: 1,
    height: TAB_HEIGHT,
    justifyContent: "center",
    paddingHorizontal: 10,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  lineCover: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -2,
    height: 2,
  },
  closeIcon: {
    includeFontPadding: false,
    paddingTop: 1,
  },
});
