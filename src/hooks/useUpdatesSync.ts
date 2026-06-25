import { openUpdateAvailableModal } from "@/components/CheckForUpdate";
import { useDebugStore } from "@/debug/debugStore";
import * as ExpoInAppUpdates from "expo-in-app-updates";
import * as Updates from "expo-updates";
import { useEffect } from "react";

// ------------------------------------------------------------
// Check for both OTA (expo-updates) and store (Play/App Store)
// updates once on app mount. The OTA check silently reloads with
// the new bundle; the store check shows the "Update available"
// modal if one exists.
// ------------------------------------------------------------
export function useUpdatesSync() {
  useEffect(() => {
    if (__DEV__) {
      // Dev-only test for the auto-launch flow — see DebugPanel's -> "Toggle 'Update available' On Launch"
      if (useDebugStore.getState().forceUpdateOnLaunch) {
        openUpdateAvailableModal();
      }
      return;
    }

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

    const checkStoreUpdate = async () => {
      try {
        const { updateAvailable } = await ExpoInAppUpdates.checkForUpdate();
        if (updateAvailable) {
          openUpdateAvailableModal();
        }
      } catch {
        // Not installed via Play/App Store (e.g. sideloaded dev build), or no
        // AppStoreID configured yet on iOS — silently ignore
      }
    };

    checkOtaUpdate();
    checkStoreUpdate();
  }, []);
}
