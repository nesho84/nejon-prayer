import { createContext, useContext, useEffect, useMemo, useRef, useCallback, useState } from "react";
import { storage } from "@/store/storage";
import notifee, { AndroidColor } from "@notifee/react-native";
import { useAppContext } from "@/context/AppContext";
import { usePrayersContext } from "@/context/PrayersContext";
import { useLanguageStore } from "@/store/languageStore";
import { scheduleNotifications, handleNotificationEvent } from '@/services/notificationsService';
import { useDeviceSettingsStore } from "@/store/deviceSettingsStore";

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

    // Ref to prevent race conditions
    const schedulingInProgress = useRef(false);

    const { isReady: settingsReady } = useAppContext();
    const { prayerTimes, isReady: prayersReady } = usePrayersContext();

    // Stores
    const language = useLanguageStore((state) => state.language);
    const tr = useLanguageStore((state) => state.tr);

    const notificationPermission = useDeviceSettingsStore((state) => state.notificationPermission);

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
        }
    }, []);

    // ------------------------------------------------------------
    // Save individual prayer notifications settings to MMKV storage (nested updates)
    // ------------------------------------------------------------
    const savePrayerNotifSettings = useCallback((prayer, updates) => {
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
        if (!notificationPermission || !prayerTimes) return;
        if (schedulingInProgress.current) return;

        let mounted = true;
        schedulingInProgress.current = true;

        (async () => {
            try {
                await scheduleNotifications({ prayerTimes, notifSettings, language, tr });
            } catch (err) {
                console.warn("⚠️ Failed to schedule notifications:", err);
            } finally {
                schedulingInProgress.current = false;
                if (mounted) setIsReady(true);
            }
        })();

        return () => {
            mounted = false;
            schedulingInProgress.current = false;
        };
    }, [settingsReady, notificationPermission, prayersReady, prayerTimes, notifSettings, language, tr]);

    // ------------------------------------------------------------
    // Foreground event handler for Notifee
    // ------------------------------------------------------------
    useEffect(() => {
        const unsubscribe = notifee.onForegroundEvent(async ({ type, detail }) => {
            const { notification, pressAction } = detail;
            if (!notification) return;

            try {
                await handleNotificationEvent(type, notification, pressAction, 'foreground');
            } catch (err) {
                console.error('Failed to handle notification event:', err);
            }
        });
        return () => { unsubscribe(); };
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