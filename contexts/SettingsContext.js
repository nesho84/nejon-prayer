import { createContext, useContext, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import notifee, { AndroidNotificationSetting, AuthorizationStatus } from '@notifee/react-native';
import * as Location from "expo-location";

export const SettingsContext = createContext();

export function SettingsProvider({ children }) {
    const SETTINGS_KEY = "@app_settings_v1";

    const appState = useRef(AppState.currentState);

    const [settingsLoading, setSettingsLoading] = useState(true);
    const [settingsError, setSettingsError] = useState(null);

    // Persistent storage app-level settings
    const [appSettings, setAppSettings] = useState({
        onboarding: false,
        language: null,
        location: null,
        prayerTimes: null,
        fullAddress: null,
        timeZone: null,
    });

    // Live device/system settings (not stored)
    const [deviceSettings, setDeviceSettings] = useState({
        locationPermission: false,
        notificationPermission: false,
        batteryOptimization: true,
        alarmPermission: false,
    });

    // Load settings from storage (if not found → fallback to defaults)
    const loadAppSettings = async () => {
        // Loading already started...
        try {
            setSettingsError(null);
            const saved = await AsyncStorage.getItem(SETTINGS_KEY);
            if (saved) setAppSettings(JSON.parse(saved));
        } catch (e) {
            console.warn("❌ Failed to load settings", e);
            setSettingsError("Failed to load settings");
        } finally {
            setSettingsLoading(false);
        }
    };

    // Save settings to storage (merge with current)
    const saveAppSettings = async (newSettings) => {
        setSettingsLoading(true);
        try {
            const updated = { ...appSettings, ...newSettings };
            await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
            setAppSettings(updated);
        } catch (e) {
            console.warn("❌ Failed to save settings", e);
            setSettingsError("❌ Failed to save settings");
        } finally {
            setSettingsLoading(false);
        }
    };

    // Load settings once on mount
    useEffect(() => {
        loadAppSettings();
    }, []);

    // Sync Device settings (Android only)
    const syncDeviceSettings = async () => {
        if (Platform.OS !== 'android') return;

        try {
            // Location permissions
            const locationEnabled = await Location.hasServicesEnabledAsync();

            // Notification permissions
            const nSettings = await notifee.getNotificationSettings();
            const notificationsEnabled = nSettings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
            const batteryOptimizationEnabled = await notifee.isBatteryOptimizationEnabled();
            const alarmEnabled = nSettings.android?.alarm === AndroidNotificationSetting.ENABLED;

            const newDeviceSettings = {
                locationPermission: locationEnabled,
                notificationPermission: notificationsEnabled,
                batteryOptimization: batteryOptimizationEnabled,
                alarmPermission: alarmEnabled,
            };

            // Only update state if something actually changed
            setDeviceSettings((prevSettings) => {
                const hasChanged = JSON.stringify(prevSettings) !== JSON.stringify(newDeviceSettings);
                if (hasChanged) {
                    return newDeviceSettings;
                } else {
                    return prevSettings;
                }
            });
        } catch (err) {
            console.warn('❌ Failed to sync Device setting s:', err);
        }
    };

    // AppState listener - re-check on return to foreground
    useEffect(() => {
        // Initial sync
        syncDeviceSettings();

        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                console.log("👁‍🗨 AppState → foreground → syncing settings...");
                // Slight delay to let device settings apply
                setTimeout(() => syncDeviceSettings(), 500);
            }
            appState.current = nextAppState;
            console.log('👁‍🗨 AppState →', appState.current);
        });
        return () => subscription.remove();
    }, []);

    return (
        <SettingsContext.Provider value={{
            deviceSettings,
            appSettings,
            saveAppSettings,
            settingsLoading,
            settingsError,
            reloadAppSettings: loadAppSettings,
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettingsContext() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettingsContext must be used within a SettingsProvider');
    }
    return context;
}
