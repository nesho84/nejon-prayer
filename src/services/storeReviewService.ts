import * as StoreReview from "expo-store-review";

// ------------------------------------------------------------
// Whether the platform can show the native review dialog.
// Android: true on any 5.0+ install (sideloaded included). iOS: true except TestFlight.
// ------------------------------------------------------------
export function canRequestStoreReview(): Promise<boolean> {
  return StoreReview.hasAction();
}

// ------------------------------------------------------------
// Ask for the native review dialog. No callback and no way to know if it appeared,
// so callers must not depend on the outcome. Rejects when the app isn't installed
// from the store (e.g. dev client) — expected, logged only.
// ------------------------------------------------------------
export async function requestStoreReview(): Promise<void> {
  try {
    await StoreReview.requestReview();
  } catch (err) {
    console.warn("⚠️ [storeReviewService] requestReview failed:", err);
  }
}
