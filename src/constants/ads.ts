import { Platform } from "react-native";
import { TestIds } from "react-native-google-mobile-ads";

// The live banner unit for this app. No iOS app is registered in AdMob yet, so iOS holds the
// test unit until one is.
const ANDROID_BANNER_UNIT_ID = "ca-app-pub-8752479739166396/7743991128";
const IOS_BANNER_UNIT_ID = TestIds.ADAPTIVE_BANNER;

const PLATFORM_BANNER_UNIT_ID = Platform.OS === "android" ? ANDROID_BANNER_UNIT_ID : IOS_BANNER_UNIT_ID;

// TestIds in dev — clicking a live ad from your own device risks the AdMob account.
export const BANNER_UNIT_ID = __DEV__ ? TestIds.ADAPTIVE_BANNER : PLATFORM_BANNER_UNIT_ID;

// Connectivity changes settle for this long before acting on them, so a flapping signal
// doesn't repeatedly retry the ad. The first reading skips it — a cold start that is
// already online shouldn't wait.
export const CONNECTIVITY_DEBOUNCE_MS = 2500;

// The banner's close button appears this long after the first ad renders, not together with it.
export const BANNER_CLOSE_DELAY_MS = 5000;

// A dismissed banner comes back on the first return to the app this long after the X — the
// same 30 minutes analytics uses to start a new session. Without it, a process kept alive in
// the background (e.g. Quran audio) would keep the banner hidden for days.
export const BANNER_DISMISS_RESET_MS = 30 * 60 * 1000;
