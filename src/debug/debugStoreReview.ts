import * as StoreReview from "expo-store-review";
import { Alert } from "react-native";

// ------------------------------------------------------------
// Debug utility: raw expo-store-review values, shown in the Store Review JSON modal
// and printed by debugStoreReviewPrompt. Read directly, not via storeReviewService.
// ------------------------------------------------------------
export async function getStoreReviewDiagnostics() {
    return {
        hasAction: await StoreReview.hasAction(),
        isAvailableAsync: await StoreReview.isAvailableAsync(),
        storeUrl: StoreReview.storeUrl(),
    };
}

// ------------------------------------------------------------
// Debug utility: request the native store review dialog right now and report what happened
// (console + Alert). Bypasses every eligibility gate and leaves the store counters untouched.
// Calls expo-store-review directly, not storeReviewService, to show the rejection.
// ------------------------------------------------------------
export async function debugStoreReviewPrompt() {
    const { hasAction, isAvailableAsync, storeUrl } = await getStoreReviewDiagnostics();
    const values = `hasAction: ${hasAction}\nisAvailableAsync: ${isAvailableAsync}\nstoreUrl: ${storeUrl}`;
    console.log(`⭐ [debugStoreReview]\n${values}`);

    if (!hasAction) {
        console.warn("⚠️ [debugStoreReview] hasAction() is false — not requesting");
        Alert.alert("Store review: hasAction() is false", `${values}\n\nNot requesting.`);
        return;
    }

    try {
        await StoreReview.requestReview();
        console.log("✅ [debugStoreReview] requestReview() resolved");
        Alert.alert("Store review: requestReview() resolved", `${values}\n\nThe platform decides whether a dialog shows.`);
    } catch (err) {
        console.error("❌ [debugStoreReview] requestReview() rejected:", err);
        Alert.alert("Store review: requestReview() rejected", `${values}\n\n${err instanceof Error ? err.message : String(err)}`);
    }
}
