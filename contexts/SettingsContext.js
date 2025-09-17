import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";

export const SettingsContext = createContext();

export function SettingsProvider({ children }) {
    const SETTINGS_KEY = "@app_settings_v1"; // storage key

    const [settings, setSettings] = useState({
        onboarding: false,
        language: null,
        location: null,
        notifications: false,
    });
    const [settingsLoading, setSettingsLoading] = useState(true);
    const [settingsError, setSettingsError] = useState(null);

    // Load settings from storage (if not found → fallback to defaults)
    const loadSettings = async () => {
        try {
            setSettingsError(null);
            const value = await AsyncStorage.getItem(SETTINGS_KEY);
            if (value) {
                const parsedSettings = JSON.parse(value);
                setSettings(parsedSettings);
            }
        } catch (e) {
            console.warn("⚠️ Failed to load settings", e);
            setSettingsError("Failed to load settings");
        } finally {
            setSettingsLoading(false);
        }
    };

    // Save settings to storage (merge with current)
    const saveSettings = async (newSettings) => {
        try {
            const updated = { ...settings, ...newSettings };
            await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
            setSettings(updated);
        } catch (e) {
            console.warn("Failed to save settings", e);
            setSettingsError("Failed to save settings");
        }
    };

    // Load settings once on mount
    useEffect(() => {
        loadSettings();
    }, []);

    return (
        <SettingsContext.Provider value={{
            settings,
            saveSettings,
            settingsLoading,
            settingsError,
            reloadSettings: loadSettings,
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
