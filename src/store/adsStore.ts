import { gatherConsentAndInitialize, showPrivacyOptions } from "@/services/adsService";
import { create } from "zustand";

interface AdsState {
  canRequestAds: boolean;
  // Settings shows the "Ad privacy" card only when Google requires it
  privacyOptionsRequired: boolean;
  bannerLoaded: boolean;
  bannerDismissed: boolean;
  // When the X was pressed (ms epoch), so AdBanner can bring the banner back later
  bannerDismissedAt: number | null;
  initializeAds: () => Promise<void>;
  openPrivacyOptions: () => Promise<void>;
  markBannerLoaded: () => void;
  dismissBanner: () => void;
  restoreBanner: () => void;
}

// True only while the banner actually occupies space at the bottom of the screen.
export const selectBannerVisible = (state: AdsState) =>
  state.canRequestAds && state.bannerLoaded && !state.bannerDismissed;

// Consent status is never persisted — UMP owns it and it is re-evaluated on every launch.
export const useAdsStore = create<AdsState>((set) => ({
  canRequestAds: false,
  privacyOptionsRequired: false,
  bannerLoaded: false,
  bannerDismissed: false,
  bannerDismissedAt: null,

  // Runs once at launch (useAdsSync). Gates whether any ad component may render.
  initializeAds: async () => {
    try {
      set(await gatherConsentAndInitialize());
    } catch (err) {
      console.error("❌ Failed to initialize ads:", err);
    }
  },

  // Settings' "Ad privacy" button. Applies the new consent at once: a withdrawal unmounts the
  // banner, a grant lets it load. Errors propagate so the screen can alert, like its other actions.
  openPrivacyOptions: async () => {
    set(await showPrivacyOptions());
  },

  // Lives here, not in AdBanner, so layout code can react to the banner taking space.
  // One-way on purpose: banners auto-refresh, and a failed refresh must not hide an ad
  // the native view is still showing.
  markBannerLoaded: () => set({ bannerLoaded: true }),

  // Per-session only — the store is never persisted, so this resets on relaunch.
  dismissBanner: () => set({ bannerDismissed: true, bannerDismissedAt: Date.now() }),

  // Ends a dismissal. bannerLoaded resets too: a fresh native view mounts, so the banner
  // collapses again until that view has an ad, instead of showing an empty box.
  restoreBanner: () => set({ bannerDismissed: false, bannerDismissedAt: null, bannerLoaded: false }),
}));
