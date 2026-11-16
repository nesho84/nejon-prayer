import { StoreUpdateCheck } from "@/types/storeUpdate.types";
import NetInfo from "@react-native-community/netinfo";
import * as ExpoInAppUpdates from "expo-in-app-updates";

// ------------------------------------------------------------
// Ask Play / App Store for a newer version.
// Throws when the check fails (e.g. ERROR_APP_NOT_OWNED on sideloaded/dev builds,
// or no AppStoreID on iOS yet) — the caller decides what to show.
// ------------------------------------------------------------
export async function checkForStoreUpdate(): Promise<StoreUpdateCheck> {
  // Play answers from its own cache, so a known update shows even offline
  const { updateAvailable } = await ExpoInAppUpdates.checkForUpdate();
  if (updateAvailable) return "available";

  // Offline, Play's "no update" may just be an old cache — not "up to date"
  const { isConnected } = await NetInfo.fetch();
  if (!isConnected) return "offline";

  return "upToDate";
}
