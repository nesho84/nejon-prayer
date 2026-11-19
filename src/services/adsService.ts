import mobileAds, { AdsConsent, AdsConsentPrivacyOptionsRequirementStatus } from "react-native-google-mobile-ads";

export interface AdsConsentState {
  canRequestAds: boolean;
  // Google requires a visible way to reopen the consent form (typically EEA/UK users)
  privacyOptionsRequired: boolean;
}

// ------------------------------------------------------------
// Gather UMP consent, then initialize the Mobile Ads SDK.
// Consent MUST resolve first — ads can preload the moment initialize() is called.
// ------------------------------------------------------------
export async function gatherConsentAndInitialize(): Promise<AdsConsentState> {
  try {
    await AdsConsent.gatherConsent();
  } catch (err) {
    // UMP falls back to the previous session's stored status — keep going and read it below.
    console.warn("⚠️ [adsService] gatherConsent failed:", err);
  }

  return readConsentAndInitialize();
}

// ------------------------------------------------------------
// Show Google's privacy options form, then re-read consent — the user may have withdrawn
// or granted it, and the caller must follow the new canRequestAds.
// ------------------------------------------------------------
export async function showPrivacyOptions(): Promise<AdsConsentState> {
  await AdsConsent.showPrivacyOptionsForm();
  return readConsentAndInitialize();
}

async function readConsentAndInitialize(): Promise<AdsConsentState> {
  const { canRequestAds, privacyOptionsRequirementStatus } = await AdsConsent.getConsentInfo();
  const privacyOptionsRequired =
    privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED;

  if (canRequestAds) await mobileAds().initialize();
  return { canRequestAds, privacyOptionsRequired };
}
