import { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback, use } from "react";
import { storage } from "@/store/storage";
import { useAppContext } from "@/context/AppContext";
import { useLanguageStore } from "@/store/languageStore";
import { getPrayerTimes } from "@/services/prayersService";
import { getUserLocation, hasLocationChanged } from "@/services/locationService";
import { useDeviceSettingsStore } from "@/store/deviceSettingsStore";

export const PrayersContext = createContext();

// MMKV storage key
const PRAYERS_KEY = "@prayers_key";

const STALE_DAYS = 3;

export function PrayersProvider({ children }) {
    const { appSettings, isReady: settingsReady, saveAppSettings } = useAppContext();

    // Stores
    const tr = useLanguageStore((state) => state.tr);
    const internetConnection = useDeviceSettingsStore((state) => state.internetConnection);

    const [prayerTimes, setPrayerTimes] = useState(null);
    const [prayersError, setPrayersError] = useState(null);
    const [prayersOutdated, setPrayersOutdated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isReady, setIsReady] = useState(false);

    const lastFetchedDateRef = useRef(null);
    const isFetchingRef = useRef(false);

    // Extract location for cleaner dependency tracking
    const location = appSettings?.location;

    // ------------------------------------------------------------
    // Check if data is outdated (older than STALE_DAYS)
    // ------------------------------------------------------------
    const checkIfOutdated = useCallback((timestamp) => {
        if (!timestamp) return false;
        const daysDiff = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
        return daysDiff > STALE_DAYS;
    }, []);

    // ------------------------------------------------------------
    // Read prayers from MMKV storage
    // ------------------------------------------------------------
    const readFromStorage = useCallback(() => {
        try {
            const stored = storage.getString(PRAYERS_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);

                // Restore last fetched date from storage
                if (parsed.lastFetched) {
                    lastFetchedDateRef.current = parsed.lastFetched;
                }

                return parsed;
            }
            return null;
        } catch (err) {
            console.warn("⚠️ Failed to read/parse prayers:", err);
            return null;
        }
    }, []);

    // ------------------------------------------------------------
    // Save prayers to MMKV storage
    // ------------------------------------------------------------
    const saveToStorage = useCallback((timings) => {
        try {
            const dataToSave = {
                timings,
                timestamp: Date.now(),
                lastFetched: new Date().toLocaleString("en-GB") // Persist last fetched date
            };
            storage.set(PRAYERS_KEY, JSON.stringify(dataToSave));
            return true;
        } catch (err) {
            console.warn("⚠️ Failed to save prayers:", err);
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
            // If no location, just exit
            if (!location) {
                console.log("📍 No location available");
                setPrayerTimes(null);
                setPrayersError(tr.labels.locationSet);
                return;
            }

            const saved = await readFromStorage();
            const savedTimings = saved?.timings || null;
            const savedTimestamp = saved?.timestamp || null;

            let timings = null;

            // ONLINE: fetch from API (always fetch when internet is available)
            if (internetConnection) {
                try {
                    timings = await getPrayerTimes(location);
                    if (timings) {
                        // TTimestamp and lastFetched are always fresh (removed isSame check)
                        saveToStorage(timings);

                        // ONLY update ref when successfully fetched from internet
                        lastFetchedDateRef.current = new Date().toLocaleString("en-GB");

                        console.log("🌐 Prayer times loaded from API");
                    }
                } catch (err) {
                    console.warn("⚠️ Failed to fetch prayer times:", err);
                }
            }

            // OFFLINE: Fallback to saved data if fetch failed
            if (!timings && savedTimings) {
                timings = savedTimings;
                if (checkIfOutdated(savedTimestamp)) {
                    setPrayersOutdated(true);
                }
                console.log("💾 Prayer times loaded from MMKV storage");
            }

            // No data available
            if (!timings) {
                setPrayerTimes(null);
                if (!internetConnection) {
                    // First time user with no internet
                    setPrayersError(tr.labels.noInternet);
                } else {
                    // Online but no data
                    setPrayersError(tr.labels.prayersError);
                }
                return;
            }

            // Update state
            setPrayerTimes(timings);
        } catch (err) {
            console.warn("⚠️ Failed to load prayer times:", err);
            setPrayersError(err.message || "An unexpected error occurred.");
            setPrayerTimes(null);
        } finally {
            isFetchingRef.current = false;
            setIsLoading(false);
        }
    }, [location, internetConnection, tr, readFromStorage, saveToStorage, checkIfOutdated]);

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
            setPrayersError(tr.labels.locationError);
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
            if (!mounted) return;

            if (location) {
                await loadPrayerTimes();
            } else {
                setPrayerTimes(null);
            }

            if (mounted) setIsReady(true);
        })();


        return () => { mounted = false; };
    }, [settingsReady, location, internetConnection]);

    // ------------------------------------------------------------
    // Memoize context value to prevent unnecessary re-renders
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