import { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useSettingsContext } from "@/context/SettingsContext";
import useTranslation from "@/hooks/useTranslation";
import { getPrayerTimes } from "@/services/prayerService";
import { formatUserAddress, getTimeZoneInfo } from "@/utils/geoInfo";
import webPrayers from "@/services/webPrayers.json";

export const PrayersContext = createContext();

const PRAYERS_KEY = "@app_prayers_v1";
const STALE_DAYS = 7; // consider data outdated after 7 days

export function PrayersProvider({ children }) {
    const { appSettings, deviceSettings, isReady: settingsReady, saveAppSettings } = useSettingsContext();
    const { tr } = useTranslation();

    const [prayerTimes, setPrayerTimes] = useState(null);
    const [prayersError, setPrayersError] = useState(null);
    const [prayersOutdated, setPrayersOutdated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isReady, setIsReady] = useState(false);

    const lastFetchedDateRef = useRef(null);

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
        setIsLoading(true);
        setPrayersError(null);
        try {
            const stored = await AsyncStorage.getItem(PRAYERS_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch (err) {
            console.warn("⚠️ Failed to read/parse storage:", err);
            setPrayersError(err.message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ------------------------------------------------------------
    // Save to AsyncStorage
    // ------------------------------------------------------------
    const saveToStorage = useCallback(async (timings) => {
        setIsLoading(true);
        setPrayersError(null);
        try {
            const dataToSave = { timings, timestamp: Date.now() };
            await AsyncStorage.setItem(PRAYERS_KEY, JSON.stringify(dataToSave));
            return true;
        } catch (err) {
            console.warn("⚠️ Failed to save to storage:", err);
            setPrayersError(err.message);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ------------------------------------------------------------
    // Load prayer times
    // ------------------------------------------------------------
    const loadPrayerTimes = useCallback(async () => {
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

            const saved = await readFromStorage();
            const savedTimings = saved?.timings || null;
            const savedTimestamp = saved?.timestamp || null;

            const loc = appSettings?.location;
            let timings = null;

            // ONLINE: fetch from API
            if (loc && deviceSettings?.internetConnection) {
                try {
                    timings = await getPrayerTimes(loc);
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
                setPrayersError(loc ? tr("labels.noLocation") : tr("labels.noPrayerTimes"));
                return;
            }

            // Update state
            setPrayerTimes(timings);
            lastFetchedDateRef.current = new Date().toLocaleString("en-GB");
        } catch (err) {
            console.warn("⚠️ Failed to load prayer times:", err);
            setPrayersError(err.message);
            setPrayerTimes(null);
        } finally {
            setIsLoading(false);
            setIsReady(true);
        }
    }, [appSettings?.location, deviceSettings?.internetConnection, readFromStorage, saveToStorage, checkIfOutdated, tr]);

    // -----------------------------
    // Reload prayer times
    // -----------------------------
    const reloadPrayerTimes = useCallback(async () => {
        if (!appSettings?.location || !deviceSettings?.locationPermission) {
            await resolveLocation();
        }
        await loadPrayerTimes();
    }, [appSettings?.location, deviceSettings?.locationPermission]);

    // ------------------------------------------------------------
    // Resolve location
    // ------------------------------------------------------------
    const resolveLocation = useCallback(async () => {
        // Use existing location if permitted
        if (appSettings?.location && deviceSettings?.locationPermission) {
            return appSettings.location;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            Alert.alert(tr("labels.locationDenied"), tr("labels.locationDeniedMessage"));
            return null;
        }

        let loc;
        try {
            loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Highest,
                timeout: 5000,
            });
        } catch {
            loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
                timeout: 10000,
            });
        }

        if (!loc?.coords) {
            Alert.alert(tr("labels.error"), tr("labels.locationError"));
            return null;
        }

        // Save new settings
        await saveAppSettings({
            location: loc.coords,
            fullAddress: await formatUserAddress(loc.coords),
            timeZone: await getTimeZoneInfo(loc.coords),
        });

        console.log("📍 (Prayer times) Location updated to:", loc.coords);
        return loc.coords;
    }, [appSettings?.location, deviceSettings?.locationPermission, saveAppSettings, tr]);

    // ------------------------------------------------------------
    // Computed value for hasPrayerTimes
    // ------------------------------------------------------------
    const hasPrayerTimes = useMemo(() => {
        return prayerTimes && typeof prayerTimes === 'object' && Object.keys(prayerTimes).length > 0;
    }, [prayerTimes]);

    // ------------------------------------------------------------
    // Auto-load on mount (only if settingsReady)
    // ------------------------------------------------------------
    useEffect(() => {
        if (!settingsReady) return;

        let mounted = true;

        (async () => {
            if (appSettings?.location) {
                await loadPrayerTimes();
            } else {
                if (mounted) {
                    setPrayerTimes(null);
                    setIsReady(true);
                }
            }
        })();

        return () => { mounted = false; };
    }, [settingsReady, appSettings?.location]);

    // ------------------------------------------------------------
    // Memoize context value
    // ------------------------------------------------------------
    const contextValue = useMemo(() => ({
        prayerTimes,
        prayersOutdated,
        lastFetchedDate: lastFetchedDateRef.current,
        isReady,
        isLoading,
        hasPrayerTimes,
        reloadPrayerTimes,
        prayersError,
    }), [prayerTimes, prayersOutdated, lastFetchedDateRef.current, isReady, isLoading, hasPrayerTimes, reloadPrayerTimes, prayersError]);

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