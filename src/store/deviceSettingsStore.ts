import notifee, { AndroidNotificationSetting, AuthorizationStatus } from '@notifee/react-native';
import NetInfo from "@react-native-community/netinfo";
import * as Location from "expo-location";
import { Platform } from "react-native";
import { create } from "zustand";

interface DeviceSettingsState {
  internetConnection: boolean;
  locationPermission: boolean;
  notificationPermission: boolean;
  batteryOptimization: boolean;
  alarmPermission: boolean;
  isReady: boolean;
  deviceSettingsError: string | null;
  syncDeviceSettings: () => Promise<void>;
}

export const useDeviceSettingsStore = create<DeviceSettingsState>((set, get) => ({
  locationPermission: false,
  internetConnection: false,
  notificationPermission: false,
  alarmPermission: false,
  batteryOptimization: true,

  deviceSettingsError: null,
  isReady: false,

  // Sync device settings (Android only)
  syncDeviceSettings: async () => {
    if (Platform.OS !== 'android') return;

    try {
      // Fetch all device settings in parallel
      const [
        locationEnabled,
        netInfo,
        notifeeSettings,
        batteryOptimizationEnabled
      ] = await Promise.all([
        Location.hasServicesEnabledAsync(), // locationEnabled
        NetInfo.fetch(), // netInfo (object with isConnected and isInternetReachable)
        notifee.getNotificationSettings(), // notifeeSettings
        notifee.isBatteryOptimizationEnabled(), // batteryOptimizationEnabled
      ]);

      // Derive individual settings from results
      const internetEnabled = !!(netInfo.isConnected && netInfo.isInternetReachable);
      const notificationsEnabled = notifeeSettings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
      const alarmEnabled = notifeeSettings.android?.alarm === AndroidNotificationSetting.ENABLED;


      // Create a new settings object
      const newSettings = {
        locationPermission: locationEnabled,
        internetConnection: internetEnabled,
        notificationPermission: notificationsEnabled,
        alarmPermission: alarmEnabled,
        batteryOptimization: batteryOptimizationEnabled,
      };

      // Only update if something changed
      const currentSettings = get();
      const hasChanged =
        currentSettings.locationPermission !== newSettings.locationPermission ||
        currentSettings.internetConnection !== newSettings.internetConnection ||
        currentSettings.notificationPermission !== newSettings.notificationPermission ||
        currentSettings.alarmPermission !== newSettings.alarmPermission ||
        currentSettings.batteryOptimization !== newSettings.batteryOptimization;

      if (hasChanged) {
        set(newSettings);
        // console.log('📱 Device settings synced:', JSON.stringify(newSettings, null, 2));
      }
    } catch (err: any) {
      console.warn('❌ Failed to sync device settings:', err);
      set({ deviceSettingsError: err.message || 'Failed to sync device settings' });
    } finally {
      set({ isReady: true });
    }
  },
}));