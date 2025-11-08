import { createContext, useContext, useEffect, useMemo, useRef, useCallback, useState } from "react";
import { storage } from "@/utils/storage";
import notifee from "@notifee/react-native";
import { useAppContext } from "@/context/AppContext";
import { usePrayersContext } from "@/context/PrayersContext";
import useTranslation from "@/hooks/useTranslation";
import { schedulePrayerNotifications, handleNotificationEvent } from '@/services/notificationsService';

export const NotificationsContext = createContext();

// MMKV storage key
const NOTIFICATIONS_KEY = "@notifications_key";

export function NotificationsProvider({ children }) {
    // Persistent storage app-level notifications settings
    const [notifSettings, setNotifSettings] = useState({
        volume: 1, // 0.0 to 1.0
        vibration: "on", // "on" | "off"
        snooze: 5, // minutes: 1,5,10,15,20,30,60
        prayers: {
            Imsak: { enabled: false, offset: 0 },
            Fajr: { enabled: true, offset: -15 },
            Sunrise: { enabled: false, offset: 0 },
            Dhuhr: { enabled: true, offset: 0 },
            Asr: { enabled: true, offset: 0 },
            Maghrib: { enabled: true, offset: 0 },
            Isha: { enabled: true, offset: 0 },
        },
    });

    const [isReady, setIsReady] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [notifError, setNotifError] = useState(null);

    const { deviceSettings, isReady: settingsReady } = useAppContext();
    const { prayerTimes, isReady: prayersReady } = usePrayersContext();
    const { language, tr } = useTranslation();

    // ------------------------------------------------------------
    // Load notification settings from MMKV storage
    // ------------------------------------------------------------
    const loadNotifSettings = useCallback(() => {
        setIsLoading(true);
        setNotifError(null);
        try {
            const saved = storage.getString(NOTIFICATIONS_KEY);
            if (saved) setNotifSettings(JSON.parse(saved));
        } catch (err) {
            console.warn("⚠️ Failed to load notification settings", err);
            setNotifError(err.message);
        } finally {
            setIsLoading(false);
            setIsReady(true);
        }
    }, []);

    // ------------------------------------------------------------
    // Save notifications settings to MMKV storage (top-level updates)
    // ------------------------------------------------------------
    const saveNotifSettings = useCallback((updates) => {
        setIsLoading(true);
        setNotifError(null);
        try {
            setNotifSettings((prev) => {
                const updated = { ...prev, ...updates };
                storage.set(NOTIFICATIONS_KEY, JSON.stringify(updated));
                return updated;
            });
        } catch (err) {
            console.warn("⚠️ Failed to save notification settings", err);
            setNotifError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ------------------------------------------------------------
    // Save individual prayer notifications settings to MMKV storage (nested updates)
    // ------------------------------------------------------------
    const savePrayerNotifSettings = useCallback((prayer, updates) => {
        setIsLoading(true);
        setNotifError(null);
        try {
            setNotifSettings((prev) => {
                const updated = {
                    ...prev,
                    prayers: {
                        ...prev.prayers,
                        [prayer]: {
                            ...prev.prayers[prayer],
                            ...updates,
                        },
                    },
                };
                storage.set(NOTIFICATIONS_KEY, JSON.stringify(updated));
                return updated;
            });
        } catch (err) {
            console.warn("⚠️ Failed to save prayer notification settings", err);
            setNotifError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ------------------------------------------------------------
    // Auto-load on mount
    // ------------------------------------------------------------
    useEffect(() => {
        loadNotifSettings();
    }, []);

    // ------------------------------------------------------------
    // Auto-Schedule notifications when contexts are ready and permission granted
    // ------------------------------------------------------------
    useEffect(() => {
        if (!settingsReady || !prayersReady) return;
        if (!deviceSettings?.notificationPermission || !prayerTimes) return;

        let mounted = true;

        (async () => {
            try {
                await schedulePrayerNotifications({ prayerTimes, notifSettings, language, tr });
            } catch (err) {
                console.warn("⚠️ Failed to schedule notifications:", err);
            } finally {
                if (mounted) setIsReady(true);
            }
        })();

        if (mounted) setIsReady(true);

        return () => { mounted = false; };
    }, [settingsReady, deviceSettings?.notificationPermission, language, prayersReady, prayerTimes, notifSettings]);

    // ------------------------------------------------------------
    // Foreground event handler for Notifee
    // ------------------------------------------------------------
    useEffect(() => {
        return notifee.onForegroundEvent(async ({ type, detail }) => {
            const { notification, pressAction } = detail;
            if (!notification) return;
            await handleNotificationEvent(type, notification, pressAction, 'foreground');
        });
    }, []);

    // ------------------------------------------------------------
    // Memoize context value to prevent unnecessary re-renders
    // ------------------------------------------------------------
    const contextValue = useMemo(() => ({
        notifSettings,
        saveNotifSettings,
        savePrayerNotifSettings,
        reloadNotifSettings: loadNotifSettings,
        isReady,
        isLoading,
        notifError,
    }), [
        notifSettings,
        saveNotifSettings,
        savePrayerNotifSettings,
        loadNotifSettings,
        isReady,
        isLoading,
        notifError,
    ]);

    return (
        <NotificationsContext.Provider value={contextValue}>
            {children}
        </NotificationsContext.Provider>
    );
}

export function useNotificationsContext() {
    const context = useContext(NotificationsContext);
    if (!context) throw new Error('useNotificationsContext must be used within a NotificationsProvider');
    return context;
}