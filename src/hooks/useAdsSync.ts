import { useAdsStore } from "@/store/adsStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import { useSupporterStore } from "@/store/supporterStore";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

// ------------------------------------------------------------
// Gather UMP consent and initialize the Mobile Ads SDK once per launch.
// Consent is re-evaluated every launch, never persisted. Supporters skip it entirely.
// Waits for onboarding, so the consent form never covers it.
// ------------------------------------------------------------
export function useAdsSync() {
  const onboardingComplete = useOnboardingStore((state) => state.onboardingComplete);
  const isReady = useSupporterStore((state) => state.isReady);
  const isSupporter = useSupporterStore((state) => state.isSupporter);
  const entitlementChecked = useSupporterStore((state) => state.entitlementChecked);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current || !onboardingComplete || !isReady || isSupporter) {
      return;
    }
    // Android waits for Play's answer, so a reinstalled supporter never sees the consent form
    if (Platform.OS === "android" && !entitlementChecked) {
      return;
    }
    initializedRef.current = true;
    useAdsStore.getState().initializeAds();
  }, [onboardingComplete, isReady, isSupporter, entitlementChecked]);
}
