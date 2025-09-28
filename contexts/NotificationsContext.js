import { createContext, useContext, useEffect } from "react";
import { useSettingsContext } from "@/contexts/SettingsContext";
import { usePrayersContext } from "@/contexts/PrayersContext";
import useNotifications from "@/hooks/useNotifications";

export const NotificationsContext = createContext();

export function NotificationsProvider({ children }) {
    const { appSettings, deviceSettings, settingsLoading } = useSettingsContext();
    const { prayerTimes, prayersLoading, hasPrayerTimes } = usePrayersContext();
    const {
        schedulePrayerNotifications,
        cancelPrayerNotifications,
        scheduleTestNotification
    } = useNotifications();

    // Show loading if either context is loading
    const isLoading = settingsLoading || prayersLoading;

    // ------------------------------------------------------------
    // Schedule notifications when deviceSettings or prayerTimes change
    // ------------------------------------------------------------
    useEffect(() => {
        if (!isLoading && deviceSettings?.notificationPermission && hasPrayerTimes) {
            schedulePrayerNotifications(prayerTimes);
        }
    }, [
        deviceSettings?.notificationPermission,
        appSettings.location,
        appSettings?.language,
        prayerTimes,
    ]);

    return (
        <NotificationsContext.Provider value={{
            schedulePrayerNotifications,
            cancelPrayerNotifications,
            scheduleTestNotification,
        }}>
            {children}
        </NotificationsContext.Provider>
    );
}

export function useNotificationsContext() {
    const context = useContext(NotificationsContext);
    if (context === undefined) {
        throw new Error('useNotificationsContext must be used within a NotificationsProvider');
    }
    return context;
}