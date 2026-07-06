import { cancelAllNotifications } from "@/services/notificationsService";
import { stopPlayback } from "@/services/quranPlayerService";
import { storage } from "@/store/storage";
import * as Updates from "expo-updates";

export type RestoreResult =
    | { status: "reloaded" }        // process is relaunching
    | { status: "wiped-no-reload" } // data cleared, user must reopen manually
    | { status: "failed" };         // wipe itself did not complete; data intact

// ------------------------------------------------------------
// Restores the app to a clean first-install state: cancels scheduled notifications,
// stops audio, wipes MMKV (all persisted stores), then relaunches so the app boots
// into onboarding. The relaunch is what actually reaches onboarding — clearing MMKV
// alone doesn't reset the in-memory Zustand state already held by mounted stores.
// ------------------------------------------------------------
export async function restoreDefaults(): Promise<RestoreResult> {
    await stopAudio();
    await cancelNotifications();

    if (!clearStorage()) {
        return { status: "failed" };
    }

    return reloadApp();
}

// ------------------------------------------------------------
// Stop any active playback — non-fatal, continue the wipe regardless
// ------------------------------------------------------------
async function stopAudio(): Promise<void> {
    try {
        await stopPlayback();
    } catch (err) {
        console.warn("⚠️ [resetAppService] stopPlayback failed, continuing with wipe:", err);
    }
}

// ------------------------------------------------------------
// Cancel all scheduled notifications — non-fatal, continue the wipe regardless
// ------------------------------------------------------------
async function cancelNotifications(): Promise<void> {
    try {
        await cancelAllNotifications();
    } catch (err) {
        console.warn("⚠️ [resetAppService] cancelAllNotifications failed, continuing with wipe:", err);
    }
}

// ------------------------------------------------------------
// Wipe MMKV — the only fatal step: if this fails, data is intact and "failed" is correct
// ------------------------------------------------------------
function clearStorage(): boolean {
    try {
        storage.clearAll();
        return true;
    } catch (err) {
        console.error("❌ [resetAppService] storage.clearAll failed — data intact:", err);
        return false;
    }
}

// ------------------------------------------------------------
// Relaunch into onboarding. Dev builds and updates-disabled builds can't reload,
// so the user must close and reopen the app manually.
// ------------------------------------------------------------
async function reloadApp(): Promise<RestoreResult> {
    if (__DEV__ || !Updates.isEnabled) {
        return { status: "wiped-no-reload" };
    }

    try {
        await Updates.reloadAsync();
        return { status: "reloaded" }; // unreachable on success — process tears down
    } catch (err) {
        console.error("❌ [resetAppService] reloadAsync failed after successful wipe:", err);
        return { status: "wiped-no-reload" };
    }
}
