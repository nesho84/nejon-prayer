import { useAdsStore } from "@/store/adsStore";
import { useEffect } from "react";

// ------------------------------------------------------------
// Gather UMP consent and initialize the Mobile Ads SDK once on app mount.
// Consent is re-evaluated every launch, never persisted.
// ------------------------------------------------------------
export function useAdsSync() {
  useEffect(() => {
    useAdsStore.getState().initializeAds();
  }, []);
}
