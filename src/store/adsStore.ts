import { gatherConsentAndInitialize } from "@/services/adsService";
import { create } from "zustand";

interface AdsState {
  canRequestAds: boolean;
  initializeAds: () => Promise<void>;
}

// Consent status is never persisted — UMP owns it and it is re-evaluated on every launch.
export const useAdsStore = create<AdsState>((set) => ({
  canRequestAds: false,

  // Runs once at launch (useAdsSync). Gates whether any ad component may render.
  initializeAds: async () => {
    try {
      set({ canRequestAds: await gatherConsentAndInitialize() });
    } catch (err) {
      console.error("❌ Failed to initialize ads:", err);
    }
  },
}));
