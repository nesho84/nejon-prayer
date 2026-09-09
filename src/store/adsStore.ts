import { gatherConsentAndInitialize } from "@/services/adsService";
import { create } from "zustand";

interface AdsState {
  canRequestAds: boolean;
  bannerLoaded: boolean;
  bannerDismissed: boolean;
  initializeAds: () => Promise<void>;
  markBannerLoaded: () => void;
  dismissBanner: () => void;
}

// True only while the banner actually occupies space at the bottom of the screen.
export const selectBannerVisible = (state: AdsState) =>
  state.canRequestAds && state.bannerLoaded && !state.bannerDismissed;

// Consent status is never persisted — UMP owns it and it is re-evaluated on every launch.
export const useAdsStore = create<AdsState>((set) => ({
  canRequestAds: false,
  bannerLoaded: false,
  bannerDismissed: false,

  // Runs once at launch (useAdsSync). Gates whether any ad component may render.
  initializeAds: async () => {
    try {
      set({ canRequestAds: await gatherConsentAndInitialize() });
    } catch (err) {
      console.error("❌ Failed to initialize ads:", err);
    }
  },

  // Lives here, not in AdBanner, so layout code can react to the banner taking space.
  // One-way on purpose: banners auto-refresh, and a failed refresh must not hide an ad
  // the native view is still showing.
  markBannerLoaded: () => set({ bannerLoaded: true }),

  // Per-session only — the store is never persisted, so this resets on relaunch.
  dismissBanner: () => set({ bannerDismissed: true }),
}));
