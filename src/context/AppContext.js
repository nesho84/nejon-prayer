import { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from "react";
import { storage } from "@/store/storage";

export const AppContext = createContext();

// MMKV storage key
const SETTINGS_KEY = "@settings_key";

export function AppProvider({ children }) {
    // Persistent storage app-level settings
    const [appSettings, setAppSettings] = useState({
        language: "en",
        location: null,
        fullAddress: null,
        timeZone: null,
    });

    const [isReady, setIsReady] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [settingsError, setSettingsError] = useState(null);

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
    // Auto-load on mount
    // ------------------------------------------------------------
    useEffect(() => {
        loadAppSettings();
    }, []);

    // ------------------------------------------------------------
    // Memoize context value to prevent unnecessary re-renders
    // ------------------------------------------------------------
    const contextValue = useMemo(() => ({
        appSettings,
        saveAppSettings,
        reloadAppSettings: loadAppSettings,
        isReady,
        isLoading,
        settingsError,
    }), [appSettings, saveAppSettings, loadAppSettings, isReady, isLoading, settingsError]);

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
