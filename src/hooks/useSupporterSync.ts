import { addPurchaseListeners } from "@/services/billingService";
import { useSupporterStore } from "@/store/supporterStore";
import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";

// ------------------------------------------------------------
// Keep the supporter entitlement in step with Play (Android only for now).
// The purchase listener lives app-wide — a pending payment can clear while the user is elsewhere.
// Syncs on launch and on every return to the app (also retries unfinished acknowledgements).
// ------------------------------------------------------------
export function useSupporterSync() {
  const isReady = useSupporterStore((state) => state.isReady);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    if (Platform.OS !== "android" || !isReady) {
      return;
    }
    const { syncPurchases, handlePurchase, handlePurchaseError } = useSupporterStore.getState();
    const removeListeners = addPurchaseListeners(handlePurchase, handlePurchaseError);
    syncPurchases();

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (appStateRef.current?.match(/inactive|background/) && nextAppState === "active") {
        useSupporterStore.getState().syncPurchases();
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      removeListeners();
      subscription.remove();
    };
  }, [isReady]);
}
