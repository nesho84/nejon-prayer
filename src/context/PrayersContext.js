import { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSettingsContext } from "@/context/SettingsContext";
import useTranslation from "@/hooks/useTranslation";
import { getPrayerTimes } from "@/services/prayerService";
import { getUserLocation, hasLocationChanged } from "@/services/locationService";
import webPrayers from "@/services/webPrayers.json";

export const PrayersContext = createContext();

const PRAYERS_KEY = "@app_prayers_v1";
const STALE_DAYS = 7;

export function PrayersProvider({ children }) {
    const { appSettings, deviceSettings, isReady: settingsReady, saveAppSettings } = useSettingsContext();
    const { tr } = useTranslation();

    const [prayerTimes, setPrayerTimes] = useState(null);
    const [prayersError, setPrayersError] = useState(null);
    const [prayersOutdated, setPrayersOutdated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isReady, setIsReady] = useState(false);

    const lastFetchedDateRef = useRef(null);
    const isFetchingRef = useRef(false);

    // Extract location for cleaner dependency tracking
    const location = appSettings?.location;
    const hasInternet = deviceSettings?.internetConnection;

    // ------------------------------------------------------------
    // Check if data is outdated (older than STALE_DAYS)
    // ------------------------------------------------------------
    const checkIfOutdated = useCallback((timestamp) => {
        if (!timestamp) return false;
        const daysDiff = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
        return daysDiff > STALE_DAYS;
    }, []);

    // ------------------------------------------------------------
    // Read from AsyncStorage
    // ------------------------------------------------------------
    const readFromStorage = useCallback(async () => {
        try {
            const stored = await AsyncStorage.getItem(PRAYERS_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch (err) {
            console.warn("⚠️ Failed to read/parse storage:", err);
            return null;
        }
    }, []);

    // ------------------------------------------------------------
    // Save to AsyncStorage
    // ------------------------------------------------------------
    const saveToStorage = useCallback(async (timings) => {
        try {
            const dataToSave = { timings, timestamp: Date.now() };
            await AsyncStorage.setItem(PRAYERS_KEY, JSON.stringify(dataToSave));
            return true;
        } catch (err) {
            console.warn("⚠️ Failed to save to storage:", err);
            return false;
        }
    }, []);

    // ------------------------------------------------------------
    // Load prayer times (automatically resolves location if needed)
    // ------------------------------------------------------------
    const loadPrayerTimes = useCallback(async () => {
        // Prevent concurrent calls
        if (isFetchingRef.current) {
            console.log("⏳ Prayer times loading already in progress - skipping");
            return;
        }

        isFetchingRef.current = true;
        setIsLoading(true);
        setPrayersError(null);
        setPrayersOutdated(false);
        try {
            // Web platform: use mock data
            if (Platform.OS === "web") {
                const randomIndex = Math.floor(Math.random() * webPrayers.length);
                setPrayerTimes(webPrayers[randomIndex]);
                lastFetchedDateRef.current = new Date().toLocaleString("en-GB");
                return;
            }

            // If no location, just exit
            if (!location) {
                console.log("📍 No location available");
                setPrayerTimes(null);
                setPrayersError(tr("labels.noLocation"));
                return;
            }

            const saved = await readFromStorage();
            const savedTimings = saved?.timings || null;
            const savedTimestamp = saved?.timestamp || null;

            let timings = null;

            // ONLINE: fetch from API
            if (hasInternet) {
                try {
                    timings = await getPrayerTimes(location);
                    if (timings) {
                        const isSame = savedTimings && JSON.stringify(savedTimings) === JSON.stringify(timings);
                        if (!isSame) await saveToStorage(timings);
                        console.log("🌐 Prayer times loaded from API");
                    }
                } catch (err) {
                    console.warn("⚠️ Failed to fetch prayer times:", err);
                }
            }

            // OFFLINE: Fallback to saved data if fetch failed
            if (!timings && savedTimings) {
                timings = savedTimings;
                if (checkIfOutdated(savedTimestamp)) setPrayersOutdated(true);
                console.log("💾 Prayer times loaded from AsyncStorage");
            }

            // No data available
            if (!timings) {
                setPrayerTimes(null);
                if (!hasInternet) {
                    // First time user with no internet
                    setPrayersError(tr("labels.noInternet"));
                } else {
                    // Online but no data
                    setPrayersError(tr("labels.prayersError"));
                }
                return;
            }

            // Update state
            setPrayerTimes(timings);
            lastFetchedDateRef.current = new Date().toLocaleString("en-GB");
        } catch (err) {
            console.warn("⚠️ Failed to load prayer times:", err);
            setPrayersError(err.message || "An unexpected error occurred.");
            setPrayerTimes(null);
        } finally {
            isFetchingRef.current = false;
            setIsLoading(false);
        }
    }, [location, hasInternet, tr, readFromStorage, saveToStorage, checkIfOutdated]);

    // ------------------------------------------------------------
    // Reload prayer times (requests location first, then loads)
    // ------------------------------------------------------------
    const reloadPrayerTimes = useCallback(async () => {
        setIsLoading(true);
        try {
            // Get fresh location
            const data = await getUserLocation(tr);

            if (!data) {
                console.log("❌ Could not get location");
                return;
            }

            // Check for location changes
            if (!hasLocationChanged(appSettings, data)) {
                console.log("📍 Location unchanged — skipping save");
            } else {
                // Save location to appSettings
                await saveAppSettings({
                    location: data.location,
                    fullAddress: data.fullAddress,
                    timeZone: data.timeZone
                });
                console.log("📍  (Prayer times) Location updated to:", data.location);
            }

            // Load prayer times with new location
            await loadPrayerTimes();
        } catch (err) {
            console.error("Location access error:", err);
            setPrayersError(tr("labels.locationError"));
        } finally {
            setIsLoading(false);
            setIsReady(true);
        }

        // (useEffect will also trigger, but loadPrayerTimes guard prevents double-load)
    }, [tr, saveAppSettings, loadPrayerTimes]);

    // ------------------------------------------------------------
    // Auto-load on mount (only if settingsReady)
    // ------------------------------------------------------------
    useEffect(() => {
        if (!settingsReady) return;

        let mounted = true;

        (async () => {
            if (location) {
                await loadPrayerTimes();
            } else {
                setPrayerTimes(null);
            }
        })();

        if (mounted) setIsReady(true);

        return () => { mounted = false; };
    }, [settingsReady, location]);

    // ------------------------------------------------------------
    // Memoize context value
    // ------------------------------------------------------------
    const contextValue = useMemo(() => ({
        prayerTimes,
        prayersOutdated,
        lastFetchedDate: lastFetchedDateRef.current,
        isReady,
        isLoading,
        reloadPrayerTimes,
        prayersError,
    }), [prayerTimes, prayersOutdated, isReady, isLoading, reloadPrayerTimes, prayersError]);

    return (
        <PrayersContext.Provider value={contextValue}>
            {children}
        </PrayersContext.Provider>
    );
}

export function usePrayersContext() {
    const context = useContext(PrayersContext);
    if (!context) throw new Error('usePrayersContext must be used within a PrayersProvider');
    return context;
}