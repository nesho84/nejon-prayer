import * as Application from "expo-application";
import * as IntentLauncher from "expo-intent-launcher";
import { Linking, Platform } from "react-native";
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
