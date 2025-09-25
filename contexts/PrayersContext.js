import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import * as Location from "expo-location";
import { useSettingsContext } from "@/contexts/SettingsContext";
import useTranslation from "@/hooks/useTranslation";

export const PrayersContext = createContext();

export function PrayersProvider({ children }) {
    const PRAYERS_KEY = "@app_prayers_v1";

    const { appSettings, settingsLoading } = useSettingsContext();
    const { tr } = useTranslation();

    const lastFetchedDate = useRef(null);
    const lastFetchedLocation = useRef(null);

    const [prayersTimes, setPrayersTimes] = useState([]);
    const [prayersLoading, setPrayersLoading] = useState(true);
    const [prayersError, setPrayersError] = useState(null);

    // Fetch prayers times from API
    const fetchPrayersTimes = async (location) => {
        // Don't fetch if no location
        if (!location) {
            setPrayersTimes([]);
            setPrayersLoading(false);
            lastFetchedLocation.current = null;
            return;
        }

        // Don't refetch if location hasn't changed
        if (lastFetchedLocation.current == location && prayersTimes.length > 0) {
            console.log("🟢 Location unchanged - keeping existing prayer times");
            setPrayersLoading(false);
            return;
        }

        try {
            setPrayersLoading(true);
            setPrayersError(null);

            const now = new Date();
            const timestamp = Math.floor(now.getTime() / 1000);
            const url = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${location.latitude}&longitude=${location.longitude}&method=2`;

            const response = await fetch(url);
            const result = await response.json();
            const allTimes = result.data.timings;

            if (result.data && result.data.timings) {
                // Parse Fajr -> Date
                const [fajrH, fajrM] = allTimes["Fajr"].split(":").map(Number);
                const fajrDate = new Date();
                fajrDate.setHours(fajrH, fajrM, 0, 0);
                // Imsak = Fajr - 20 minutes
                const imsakDate = new Date(fajrDate.getTime() - 20 * 60000);
                // Ensure spacing rule (Imsak vs Fajr)
                if ((fajrDate - imsakDate) / 60000 < 25) {
                    fajrDate.setMinutes(imsakDate.getMinutes() + 5);
                }
                //  format Date -> "HH:mm" (always 24h, no AM/PM)
                const formatTime = (date) =>
                    `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
                const correctedFajr = formatTime(fajrDate);
                const correctedImsak = formatTime(imsakDate);
                // Final object e.g. { Fajr: "05:46", Dhuhr: "12:50", ... }
                const PRAYER_ORDER_FULL = ["Imsak", "Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
                const filtered = {};
                PRAYER_ORDER_FULL.forEach((key) => {
                    if (key === "Fajr") filtered[key] = correctedFajr;
                    else if (key === "Imsak") filtered[key] = correctedImsak;
                    else if (allTimes[key]) filtered[key] = allTimes[key]; // API is already "HH:mm"
                });

                setPrayersTimes(filtered);
                lastFetchedLocation.current = location;

                // Formated date and time
                const formatted = new Date().toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false
                });
                lastFetchedDate.current = formatted;
            } else {
                throw new Error("Invalid API response format");
            }
        } catch (err) {
            console.warn("❌ Failed to fetch prayer data:", err);
            setPrayersError(err.message);
            setPrayersTimes([]);
        } finally {
            setPrayersLoading(false);
        }
    }

    // Re-fetch prayer times
    const refetchPrayersTimes = async () => {
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

            await fetchPrayersTimes(loc.coords);
        } catch (err) {
            console.error("Location access error:", err);
            Alert.alert(tr("labels.error"), tr("labels.locationError"));
        } finally {
            setPrayersLoading(false);
        }
    }

    // Fetch prayer data when settings load and location changes
    useEffect(() => {
        if (!settingsLoading) {
            fetchPrayersTimes(appSettings.location);
        }
    }, [settingsLoading, appSettings.location]);

    return (
        <PrayersContext.Provider value={{
            prayersTimes,
            prayersLoading,
            prayersError,
            lastFetchedDate: lastFetchedDate.current,
            hasPrayersTimes: prayersTimes && typeof prayersTimes === 'object' && Object.keys(prayersTimes).length > 0,
            refetchPrayersTimes,
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