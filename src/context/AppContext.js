import { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from "react";
import { AppState, Platform } from "react-native";
import { storage } from "@/utils/storage";
import NetInfo from "@react-native-community/netinfo";
import * as Location from "expo-location";
import notifee, { AndroidNotificationSetting, AuthorizationStatus } from '@notifee/react-native';

export const AppContext = createContext();

// MMKV storage key
const SETTINGS_KEY = "@settings_key";

export function AppProvider({ children }) {
    // Persistent storage app-level settings
    const [appSettings, setAppSettings] = useState({
        onboarding: false,
        language: "en",
        location: null,
        fullAddress: null,
        timeZone: null,
    });

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
    // Load app settings from MMKV storage
    // ------------------------------------------------------------
    const loadAppSettings = useCallback(() => {
        setIsLoading(true);
        setSettingsError(null);
        try {
            const saved = storage.getString(SETTINGS_KEY);
            if (saved) setAppSettings(JSON.parse(saved));
        } catch (err) {
            console.warn("⚠️ Failed to load settings", err);
            setSettingsError(err.message);
        } finally {
            setIsLoading(false);
            setIsReady(true);
        }
    }, []);

    // ------------------------------------------------------------
    // Save app settings to MMKV storage (top-level updates)
    // ------------------------------------------------------------
    const saveAppSettings = useCallback((updates) => {
        setIsLoading(true);
        setSettingsError(null);
        try {
            setAppSettings((prev) => {
                const updated = { ...prev, ...updates };
                storage.set(SETTINGS_KEY, JSON.stringify(updated));
                return updated;
            });
        } catch (err) {
            console.warn("⚠️ Failed to save settings", err);
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
            console.warn('❌ Failed to sync device settings:', err);
        }
    }, []);

    // ------------------------------------------------------------
    // Auto-load on mount
    // ------------------------------------------------------------
    useEffect(() => {
        let mounted = true;

        loadAppSettings();

        if (mounted) syncDeviceSettings();

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
    // Memoize context value to prevent unnecessary re-renders
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
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    const context = useContext(AppContext);
    if (!context) throw new Error('useAppContext must be used within a AppProvider');
    return context;
}
