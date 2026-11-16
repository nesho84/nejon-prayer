import * as Updates from "expo-updates";
import { useEffect } from "react";

// ------------------------------------------------------------
// Check for an OTA (expo-updates) update once on mount — downloads and reloads silently.
// The store update check lives in useAutoModals.
// ------------------------------------------------------------
export function useOtaUpdatesSync() {
  useEffect(() => {
    if (__DEV__) return;

    const checkOtaUpdate = async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          Updates.reloadAsync();
        }
      } catch {
        // Network unavailable or EAS unreachable — silently ignore
      }
    };

    checkOtaUpdate();
  }, []);
}
