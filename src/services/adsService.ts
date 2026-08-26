import mobileAds, { AdsConsent } from "react-native-google-mobile-ads";

// ------------------------------------------------------------
// Gather UMP consent, then initialize the Mobile Ads SDK.
// Consent MUST resolve first — ads can preload the moment initialize() is called.
// ------------------------------------------------------------
export async function gatherConsentAndInitialize(): Promise<boolean> {
  try {
    await AdsConsent.gatherConsent();
  } catch (err) {
    // UMP falls back to the previous session's stored status — keep going and read it below.
    console.warn("⚠️ [adsService] gatherConsent failed:", err);
  }

  const { canRequestAds } = await AdsConsent.getConsentInfo();
  if (!canRequestAds) return false;

  await mobileAds().initialize();
  return true;
}
