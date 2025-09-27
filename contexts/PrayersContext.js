import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import * as Location from "expo-location";
import { useSettingsContext } from "@/contexts/SettingsContext";
import useTranslation from "@/hooks/useTranslation";
import { getPrayerTimes } from "@/utils/prayersApi";
import { formatAddress, formatTimezone } from "@/utils/geoInfo";

export const PrayersContext = createContext();

export function PrayersProvider({ children }) {
    const PRAYERS_KEY = "@app_prayers_v1";

    const { appSettings, settingsLoading, saveAppSettings } = useSettingsContext();
    const { tr } = useTranslation();

    const lastFetchedDate = useRef(null);

    const [prayerTimes, setPrayerTimes] = useState([]);
    const [prayersLoading, setPrayersLoading] = useState(true);
    const [prayersError, setPrayersError] = useState(null);

    // Fetch prayers times from aladhan API
    const fetchPrayerTimes = async (location) => {
        // Don't fetch if no location
        if (!location) {
            setPrayerTimes([]);
            setPrayersLoading(false);
            return;
        }

        try {
            setPrayersLoading(true);
            setPrayersError(null);

            const timings = await getPrayerTimes(location);

            if (timings) {
                const PRAYER_ORDER_FULL = ["Imsak", "Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];

                const filtered = {};
                PRAYER_ORDER_FULL.forEach((key) => {
                    if (timings[key]) filtered[key] = timings[key]; // already HH:mm
                });

                setPrayerTimes(filtered);
                lastFetchedDate.current = new Date().toLocaleString("en-GB");
            } else {
                throw new Error("Invalid API response format");
            }
        } catch (err) {
            console.warn("❌ Failed to fetch prayer times:", err);
            setPrayersError(err.message);
            setPrayerTimes([]);
        } finally {
            setPrayersLoading(false);
        }
    }

    // Re-fetch prayer times
    const refetchPrayerTimes = async () => {
        setPrayersLoading(true)
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert(tr("labels.locationDenied"), tr("labels.locationDeniedMessage"));
                return;
            }
            // Try high accuracy first, fallback to balanced
            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Highest,
                timeout: 5000,
            }).catch(() =>
                Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                    timeout: 10000,
                })
            );
            if (!loc?.coords) {
                Alert.alert(tr("labels.error"), tr("labels.locationError"));
                return;
            }

            const newFullAddress = await formatAddress(loc.coords);
            const newTimeZone = await formatTimezone(loc.coords);

            // Save settings
            await saveAppSettings({
                location: loc.coords,
                fullAddress: newFullAddress,
                timeZone: newTimeZone
            });

            console.log("📍 Location updated to:", loc.coords);

            await fetchPrayerTimes(loc.coords);

            console.log("✅ Prayer times updated");
        } catch (err) {
            console.warn("❌ Failed to re-fetch prayer times:", err);
        } finally {
            setPrayersLoading(false);
        }
    }

    // Fetch prayer data when settings load and location changes
    useEffect(() => {
        if (!settingsLoading) {
            fetchPrayerTimes(appSettings.location);
        }
    }, [settingsLoading, appSettings.location]);

    return (
        <PrayersContext.Provider value={{
            prayerTimes,
            hasPrayerTimes: prayerTimes && typeof prayerTimes === 'object' && Object.keys(prayerTimes).length > 0,
            prayersLoading,
            prayersError,
            lastFetchedDate: lastFetchedDate.current,
            refetchPrayerTimes,
        }}>
            {children}
        </PrayersContext.Provider>
    );
}

export function usePrayersContext() {
    const context = useContext(PrayersContext);
    if (context === undefined) {
        throw new Error('usePrayersContext must be used within a PrayersProvider');
    }
    return context;
}