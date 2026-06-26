import { APPLE_STORE_NATIVE_URL, APPLE_STORE_URL, GOOGLE_PLAY_NATIVE_URL, GOOGLE_PLAY_URL } from "@/constants/links";
import * as Application from "expo-application";
import * as Clipboard from "expo-clipboard";
import * as IntentLauncher from "expo-intent-launcher";
import { Linking, Platform, Share } from "react-native";
import notifee from "react-native-notify-kit";

// ------------------------------------------------------------
// Open Battery Optimization settings
// Android: deep-link to the exact settings screen if possible, else fall back to notifee's picker
// iOS: no equivalent — open the app's general settings page
// ------------------------------------------------------------
export const openBatteryOptimizationSettings = async (): Promise<void> => {
  if (Platform.OS === "android") {
    const packageName = Application.applicationId ?? "";
    const batteryOptimizationEnabled = await notifee.isBatteryOptimizationEnabled();

    if (batteryOptimizationEnabled) {
      try {
        await IntentLauncher.startActivityAsync(
          "android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS",
          { data: `package:${packageName}` }
        );
        return;
      } catch {
        // fallthrough...
      }
    }

    await notifee.openBatteryOptimizationSettings();
  } else {
    Linking.openSettings();
  }
};

// ------------------------------------------------------------
// Open Alarms & Reminders settings
// Android: notifee's dedicated screen; iOS: no equivalent — open the app's general settings page
// ------------------------------------------------------------
export const openAlarmPermissionSettings = async (): Promise<void> => {
  if (Platform.OS === "android") {
    await notifee.openAlarmPermissionSettings();
  } else {
    Linking.openSettings();
  }
};

// ------------------------------------------------------------
// Open device Notification settings
// Android: notifee's dedicated screen; iOS: no equivalent — open the app's general settings page
// ------------------------------------------------------------
export const openNotificationSettings = async (): Promise<void> => {
  if (Platform.OS === "android") {
    await notifee.openNotificationSettings();
  } else {
    Linking.openSettings();
  }
};

// ------------------------------------------------------------
// Open an external URL, failing silently if no app can handle it.
// Note: doesn't pre-check via Linking.canOpenURL — on Android 11+ that requires
// the scheme to be declared in <queries> (e.g. mailto:), which this app doesn't
// do, so canOpenURL would false-negative on working links like mailto: ones.
// ------------------------------------------------------------
export const openExternalUrl = async (url: string): Promise<void> => {
  try {
    await Linking.openURL(url);
  } catch {
    // No app can handle this URL — fail silently
  }
};

// ------------------------------------------------------------
// Open this app's own store listing for the current platform: try the native deep link
// (market://, itms-apps://) directly into the store app; if no app can handle it (no
// Play Store/App Store installed), fall back to the https:// listing.
// ------------------------------------------------------------
export const openStoreListing = async (): Promise<void> => {
  const nativeUrl = Platform.OS === "ios" ? APPLE_STORE_NATIVE_URL : GOOGLE_PLAY_NATIVE_URL;
  const webUrl = Platform.OS === "ios" ? APPLE_STORE_URL : GOOGLE_PLAY_URL;

  try {
    await Linking.openURL(nativeUrl);
  } catch {
    await openExternalUrl(webUrl);
  }
};

// ------------------------------------------------------------
// Share text via the native share sheet.
// Builds a "title\n\nbody" message (just the title if body is empty).
// dialogTitle is the Android chooser-sheet heading (defaults to title).
// Returns true if the user actually shared, false on dismiss/error.
// ------------------------------------------------------------
export const shareText = async (title: string, body: string, dialogTitle?: string): Promise<boolean> => {
  try {
    const result = await Share.share(
      { title, message: body ? `${title}\n\n${body}` : title },
      { dialogTitle: dialogTitle ?? title, subject: title }
    );
    return result.action === Share.sharedAction;
  } catch (err) {
    console.error("Share failed:", err);
    return false;
  }
};

// ------------------------------------------------------------
// Copy text to the clipboard.
// Builds a "title\n\nbody" string (just the title if body is empty).
// Returns true on success, false on error.
// ------------------------------------------------------------
export const copyText = async (title: string, body: string): Promise<boolean> => {
  try {
    await Clipboard.setStringAsync(body ? `${title}\n\n${body}` : title);
    return true;
  } catch (err) {
    console.error("Copy failed:", err);
    return false;
  }
};
