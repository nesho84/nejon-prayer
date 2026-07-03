const ANDROID_PACKAGE_ID = "com.nejon.nejonprayer";
const APP_STORE_ID = ""; // @TODO: set once the iOS app is published to the App Store

export const NEJON_WEBSITE_URL = "https://nejon.net";

export const GOOGLE_PLAY_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_ID}`;
export const GOOGLE_PLAY_NATIVE_URL = `market://details?id=${ANDROID_PACKAGE_ID}`;
export const MORE_APPS_GOOGLE_PLAY_URL = "https://play.google.com/store/apps/developer?id=Neshat%20Ademi";
// export const MORE_APPS_GOOGLE_PLAY_URL_ALT = "https://play.google.com/store/search?q=nejon&c=apps"; // Alternative search URL

// iOS app isn't published yet — until APP_STORE_ID is set these fall back to the website,
// so the rate / share / update links never resolve to a broken App Store id.
export const APPLE_STORE_URL = APP_STORE_ID ? `https://apps.apple.com/app/id${APP_STORE_ID}` : NEJON_WEBSITE_URL;
export const APPLE_STORE_NATIVE_URL = APP_STORE_ID ? `itms-apps://itunes.apple.com/app/id${APP_STORE_ID}` : NEJON_WEBSITE_URL;
export const MORE_APPS_APP_STORE_URL = NEJON_WEBSITE_URL; // @TODO: set to the App Store developer page once confirmed

export const CONTACT_EMAIL = "mailto:support@nejon.net";
export const HELP_EMAIL = "mailto:help@nejon.net";
export const PAYPAL_DONATE_URL = "https://paypal.me/NeshatAdemi?locale.x=de_DE&country.x=AT";
export const PRIVACY_POLICY_URL = "https://nejon-prayer.nejon.net/privacy.html";
