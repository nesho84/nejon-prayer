import { Platform } from "react-native";
import { TestIds } from "react-native-google-mobile-ads";

// The live banner unit for this app. No iOS app is registered in AdMob yet, so iOS holds the
// test unit until one is.
const ANDROID_BANNER_UNIT_ID = "ca-app-pub-8752479739166396/7743991128";
const IOS_BANNER_UNIT_ID = TestIds.BANNER;

const PLATFORM_BANNER_UNIT_ID = Platform.OS === "android" ? ANDROID_BANNER_UNIT_ID : IOS_BANNER_UNIT_ID;

// TestIds in dev — clicking a live ad from your own device risks the AdMob account.
export const BANNER_UNIT_ID = __DEV__ ? TestIds.BANNER : PLATFORM_BANNER_UNIT_ID;

// Connectivity changes settle for this long before acting on them, so a flapping signal
// doesn't repeatedly retry the ad. The first reading skips it — a cold start that is
// already online shouldn't wait.
export const CONNECTIVITY_DEBOUNCE_MS = 2500;
