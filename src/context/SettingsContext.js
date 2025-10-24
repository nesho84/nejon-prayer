import { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from "react";
import { AppState, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import * as Location from "expo-location";
import notifee, { AndroidNotificationSetting, AuthorizationStatus } from '@notifee/react-native';

export const SettingsContext = createContext();

const SETTINGS_KEY = "@app_settings_v1";

const DEFAULT_SETTINGS = {
    onboarding: false,
    language: "en",
    location: null,
    fullAddress: null,
    timeZone: null,
    notificationsConfig: {
        volume: 1, // off or 0.0 to 1.0
        vibration: 'on', // on or off
        snoozeTimeout: 5, // minutes (1, 5, 10, 15, 20, 30, 60)
    }
};

export function SettingsProvider({ children }) {
    // Persistent storage app-level settings
    const [appSettings, setAppSettings] = useState(DEFAULT_SETTINGS);

    // Live device/system settings (not stored)
    const [deviceSettings, setDeviceSettings] = useState({
        internetConnection: false,
        locationPermission: false,
        notificationPermission: false,
        batteryOptimization: true,
        alarmPermission: false,
    });

    const [isReady, setIsReady] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [settingsError, setSettingsError] = useState(null);

    const appStateRef = useRef(AppState.currentState);

    // ------------------------------------------------------------
    // Load settings from AsyncStorage
    // ------------------------------------------------------------
    const loadAppSettings = useCallback(async () => {
        setIsLoading(true);
        setSettingsError(null);
        try {
            const saved = await AsyncStorage.getItem(SETTINGS_KEY);
            if (saved !== null) setAppSettings(JSON.parse(saved));
        } catch (err) {
            console.warn("❌ Failed to load settings", err);
            setSettingsError(err.message);
        } finally {
            setIsLoading(false);
            setIsReady(true);
        }
    }, []);

    // ------------------------------------------------------------
    // Save settings to AsyncStorage
    // ------------------------------------------------------------
    const saveAppSettings = useCallback(async (newSettings) => {
        setIsLoading(true);
        setSettingsError(null);
        try {
            // Use functional update to get current state
            setAppSettings((prev) => {
                const updated = { ...prev, ...newSettings };
                // Save to storage after state update
                AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated)).catch(err => {
                    console.warn("❌ Failed to save settings in AsyncStorage", err);
                    setSettingsError(err.message);
                });
                return updated;
            });
        } catch (err) {
            console.warn("❌ Failed to save appSettings", err);
            setSettingsError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ------------------------------------------------------------
    // Sync Device settings (Android only)
    // ------------------------------------------------------------
    const syncDeviceSettings = useCallback(async () => {
        if (Platform.OS !== 'android') return;

        try {
            // Location permissions
            const locationEnabled = await Location.hasServicesEnabledAsync();
            // Notification permissions
            const ns = await notifee.getNotificationSettings();
            const notificationsEnabled = ns.authorizationStatus === AuthorizationStatus.AUTHORIZED;
            const batteryOptimizationEnabled = await notifee.isBatteryOptimizationEnabled();
            const alarmEnabled = ns.android?.alarm === AndroidNotificationSetting.ENABLED;
            // Internet connection
            const netInfo = await NetInfo.fetch();
            const internetEnabled = !!(netInfo.isConnected && netInfo.isInternetReachable);

            const newDeviceSettings = {
                internetConnection: internetEnabled,
                locationPermission: locationEnabled,
                notificationPermission: notificationsEnabled,
                batteryOptimization: batteryOptimizationEnabled,
                alarmPermission: alarmEnabled,
            };

            // Only update state if something actually changed
            setDeviceSettings((prevSettings) => {
                const hasChanged = JSON.stringify(prevSettings) !== JSON.stringify(newDeviceSettings);
                return hasChanged ? newDeviceSettings : prevSettings;
            });
        } catch (err) {
            console.warn('❌ Failed to sync Device settings:', err);
        }
    }, []);

    // ------------------------------------------------------------
    // Auto-load on mount
    // ------------------------------------------------------------
    useEffect(() => {
        let mounted = true;

        (async () => {
            await loadAppSettings();
            if (mounted) syncDeviceSettings();
        })();

        return () => { mounted = false; };
    }, [loadAppSettings, syncDeviceSettings]);

    // ------------------------------------------------------------
    // AppState listener - sync device settings!
    // ------------------------------------------------------------
    useEffect(() => {
        const subscription = AppState.addEventListener("change", (nextAppState) => {
            if (appStateRef.current.match(/inactive|background/) && nextAppState === "active") {
                syncDeviceSettings();
            }
            appStateRef.current = nextAppState;
            console.log('👁‍🗨 AppState →', appStateRef.current);
        });

        return () => subscription.remove(); //
    }, [syncDeviceSettings]);

    // ------------------------------------------------------------
    // Memoize context value
    // ------------------------------------------------------------
    const contextValue = useMemo(() => ({
        appSettings,
        deviceSettings,
        saveAppSettings,
        reloadAppSettings: loadAppSettings,
        isReady,
        isLoading,
        settingsError,
    }), [appSettings, deviceSettings, saveAppSettings, loadAppSettings, isReady, isLoading, settingsError]);

    return (
        <SettingsContext.Provider value={contextValue}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettingsContext() {
    const context = useContext(SettingsContext);
    if (!context) throw new Error('useSettingsContext must be used within a SettingsProvider');
    return context;
}
