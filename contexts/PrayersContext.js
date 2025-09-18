import { createContext, useContext, useEffect, useState } from "react";
import { useSettingsContext } from "@/contexts/SettingsContext";

export const PrayersContext = createContext();

export function PrayersProvider({ children }) {
    const { settings, settingsLoading } = useSettingsContext();

    const [prayersTimes, setPrayersTimes] = useState([]);
    const [prayersLoading, setPrayersLoading] = useState(true);
    const [prayersError, setPrayersError] = useState(null);
    const [lastFetchedLocation, setLastFetchedLocation] = useState(null);

    // Fetch prayers times from API
    const fetchPrayersTimes = async (location) => {
        // Don't fetch if no location
        if (!location) {
            setPrayersTimes([]);
            setPrayersLoading(false);
            setLastFetchedLocation(null);
            return;
        }

        // Don't refetch if location hasn't changed
        if (location === lastFetchedLocation && prayersTimes.length > 0) {
            setPrayersLoading(false);
            return;
        }

        try {
            setPrayersLoading(true);
            setPrayersError(null);
            // console.log("Fetching prayer times for location:", location);

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
                setLastFetchedLocation(location);
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

    // Fetch prayer data when settings load and location changes
    useEffect(() => {
        if (!settingsLoading) {
            fetchPrayersTimes(settings.location);
        }
    }, [settings.location, settingsLoading]);

    // Reset prayer data if settings are reloading
    useEffect(() => {
        if (settingsLoading) {
            setPrayersLoading(true);
        }
    }, [settingsLoading]);

    return (
        <PrayersContext.Provider value={{
            prayersTimes,
            prayersLoading,
            prayersError,
            refetchPrayersTimes: () => fetchPrayersTimes(settings.location),
            // Helper to check if we have valid data
            hasPrayersTimes: prayersTimes && typeof prayersTimes === 'object' && Object.keys(prayersTimes).length > 0,
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