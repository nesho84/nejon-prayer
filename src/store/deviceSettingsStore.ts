import { create } from "zustand";
import { Platform } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import * as Location from "expo-location";
import notifee, { AndroidNotificationSetting, AuthorizationStatus } from '@notifee/react-native';

interface DeviceSettingsState {
  internetConnection: boolean;
  locationPermission: boolean;
  notificationPermission: boolean;
  batteryOptimization: boolean;
  alarmPermission: boolean;
  syncDeviceSettings: () => Promise<void>;
}

export const useDeviceSettingsStore = create<DeviceSettingsState>((set, get) => ({
  // Initial state (all false/true defaults)
  internetConnection: false,
  locationPermission: false,
  notificationPermission: false,
  batteryOptimization: true,
  alarmPermission: false,

  // Sync device settings (Android only)
  syncDeviceSettings: async () => {
    if (Platform.OS !== 'android') return;

    try {
      // Fetch all device settings in parallel
      const [locationEnabled, ns, batteryOptimizationEnabled, netInfo] = await Promise.all([
        Location.hasServicesEnabledAsync(),
        notifee.getNotificationSettings(),
        notifee.isBatteryOptimizationEnabled(),
        NetInfo.fetch(),
      ]);

      // Determine permissions and settings
      const notificationsEnabled = ns.authorizationStatus === AuthorizationStatus.AUTHORIZED;
      const alarmEnabled = ns.android?.alarm === AndroidNotificationSetting.ENABLED;
      const internetEnabled = !!(netInfo.isConnected && netInfo.isInternetReachable);

      // Create a new settings object
      const newSettings = {
        internetConnection: internetEnabled,
        locationPermission: locationEnabled,
        notificationPermission: notificationsEnabled,
        batteryOptimization: batteryOptimizationEnabled,
        alarmPermission: alarmEnabled,
      };

      // Only update if something changed
      const currentSettings = get();
      const hasChanged =
        currentSettings.internetConnection !== newSettings.internetConnection ||
        currentSettings.locationPermission !== newSettings.locationPermission ||
        currentSettings.notificationPermission !== newSettings.notificationPermission ||
        currentSettings.batteryOptimization !== newSettings.batteryOptimization ||
        currentSettings.alarmPermission !== newSettings.alarmPermission;

      if (hasChanged) {
        set(newSettings);
        // console.log('📱 Device settings synced:', JSON.stringify(newSettings, null, 2));
      }
    } catch (err) {
      console.warn('❌ Failed to sync device settings:', err);
    }
  },
}));