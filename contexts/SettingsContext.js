import { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from "react";
import { AppState, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import * as Location from "expo-location";
import notifee, { AndroidNotificationSetting, AuthorizationStatus } from '@notifee/react-native';

export const SettingsContext = createContext();

export function SettingsProvider({ children }) {
    const SETTINGS_KEY = "@app_settings_v1";

    const appState = useRef(AppState.currentState);

    // Persistent storage app-level settings
    const [appSettings, setAppSettings] = useState({
        onboarding: false,
        language: null,
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
    const [settingsLoading, setSettingsLoading] = useState(true);
    const [settingsError, setSettingsError] = useState(null);

    // ------------------------------------------------------------
    // Load settings from storage
    // ------------------------------------------------------------
    const loadAppSettings = async () => {
        // Loading already started...
        try {
            setSettingsError(null);
            const saved = await AsyncStorage.getItem(SETTINGS_KEY);
            if (saved !== null) {
                setAppSettings(JSON.parse(saved));
            }
        } catch (err) {
            console.warn("❌ Failed to load settings", err);
            setSettingsError(err.message);
        } finally {
            setSettingsLoading(false);
        }
    };

    // ------------------------------------------------------------
    // Save settings to storage (merge with current)
    // ------------------------------------------------------------
    const saveAppSettings = useCallback(async (newSettings) => {
        setSettingsLoading(true);
        try {
            const updated = { ...appSettings, ...newSettings };
            await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
            setAppSettings(updated);
        } catch (err) {
            console.warn("❌ Failed to save settings", err);
            setSettingsError(err.message);
        } finally {
            setSettingsLoading(false);
        }
    }, [appSettings]);

    // ------------------------------------------------------------
    // Auto-load on mount
    // ------------------------------------------------------------
    useEffect(() => {
        loadAppSettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ------------------------------------------------------------
    // Sync Device settings (Android only)
    // ------------------------------------------------------------
    const syncDeviceSettings = async () => {
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
    };

    // ------------------------------------------------------------
    // AppState listener - re-check on return to foreground
    // ------------------------------------------------------------
    useEffect(() => {
        // Initial sync
        syncDeviceSettings();

        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                // console.log("⚡ AppState → foreground → syncing settings...");
                // Slight delay to let device settings apply
                setTimeout(() => syncDeviceSettings(), 300);
            }
            appState.current = nextAppState;
            console.log('👁‍🗨 AppState →', appState.current);
        });

        return () => subscription.remove();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ------------------------------------------------------------
    // Memoize context value to prevent unnecessary re-renders
    // ------------------------------------------------------------
    const contextValue = useMemo(() => ({
        appSettings,
        deviceSettings,
        saveAppSettings,
        settingsLoading,
        settingsError,
        reloadAppSettings: loadAppSettings,
    }), [appSettings, deviceSettings, saveAppSettings, settingsLoading, settingsError]);

    return (
        <SettingsContext.Provider value={contextValue}>
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
