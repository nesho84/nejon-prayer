import { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useSettingsContext } from "@/context/SettingsContext";
import useTranslation from "@/hooks/useTranslation";
import { getPrayerTimes } from "@/services/prayersApi";
import { formatUserAddress, getTimeZoneInfo } from "@/utils/geoInfo";
import webPrayers from "@/services/webPrayers.json";

export const PrayersContext = createContext();

export function PrayersProvider({ children }) {
    const PRAYERS_KEY = "@app_prayers_v1";
    const STALE_DAYS = 7; // Consider data stale after 7 days

    const { appSettings, deviceSettings, settingsLoading, saveAppSettings } = useSettingsContext();
    const { tr } = useTranslation();

    const lastFetchedDate = useRef(null);
    const isLoadingRef = useRef(false);

    const [prayerTimes, setPrayerTimes] = useState([]);
    const [prayersLoading, setPrayersLoading] = useState(false);
    const [prayersError, setPrayersError] = useState(null);
    const [prayersOutdated, setPrayersOutdated] = useState(false);

    // ------------------------------------------------------------
    // Check if data is stale (older than STALE_DAYS)
    // ------------------------------------------------------------
    const checkIfOutdated = (timestamp) => {
        if (!timestamp) return false;
        const daysDiff = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
        return daysDiff > STALE_DAYS;
    };

    // ------------------------------------------------------------
    // Read from storage
    // ------------------------------------------------------------
    const readFromStorage = async () => {
        try {
            const stored = await AsyncStorage.getItem(PRAYERS_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch (err) {
            console.warn("⚠️ Failed to read/parse storage:", err);
            return null;
        }
    };

    // ------------------------------------------------------------
    // Save to storage with timestamp
    // ------------------------------------------------------------
    const saveToStorage = async (timings) => {
        try {
            const dataToSave = { timings, timestamp: Date.now() };
            await AsyncStorage.setItem(PRAYERS_KEY, JSON.stringify(dataToSave));
            return true;
        } catch (err) {
            console.warn("⚠️ Failed to save to storage:", err);
            return false;
        }
    };

    // ------------------------------------------------------------
    // Fetch prayers times from aladhan API or load from Storage
    // ------------------------------------------------------------
    const loadPrayerTimes = async () => {
        // Prevent race conditions
        if (isLoadingRef.current) return;
        isLoadingRef.current = true;

        // Web Test: load random data from JSON
        if (Platform.OS === "web") {
            console.log("🌐 Web detected — loading random prayer times from JSON");

            // pick a random set
            const randomIndex = Math.floor(Math.random() * webPrayers.length);
            const timings = webPrayers[randomIndex];

            setPrayerTimes(timings);
            setPrayersLoading(false);
            setPrayersError(null);
            setPrayersOutdated(false);
            lastFetchedDate.current = new Date().toLocaleString("en-GB");

            return;
        }

        try {
            setPrayersLoading(true);
            setPrayersError(null);
            setPrayersOutdated(false);

            const loc = appSettings?.location;
            if (!loc) {
                setPrayerTimes([]);
                setPrayersLoading(false);
                return;
            }

            // Read storage once upfront for comparison and fallback
            const saved = await readFromStorage();
            const savedTimings = saved?.timings || null;
            const savedTimestamp = saved?.timestamp || null;

            let timings = null;
            let fromAPI = false;

            // ONLINE: fetch from API
            if (deviceSettings.internetConnection) {
                timings = await getPrayerTimes(loc).catch(() => null);
                if (timings) {
                    fromAPI = true;
                    console.log("✔ Prayer times loaded from API");
                    // Compare and save only if different
                    const isSame = savedTimings && JSON.stringify(savedTimings) === JSON.stringify(timings);
                    if (!isSame) {
                        await saveToStorage(timings);
                        console.log("✅ Prayer times saved in Storage");
                    } else {
                        console.log("🔄 Prayer times from API same as Storage — skipping save");
                    }
                }
            }

            // OFFLINE or API failed: use saved data
            if (!timings && savedTimings) {
                timings = savedTimings;
                console.log("🔧 Prayer times loaded from storage");
                // Check if saved data is stale
                if (checkIfOutdated(savedTimestamp)) {
                    setPrayersOutdated(true);
                    console.warn(`⚠️ Data is ${Math.floor((Date.now() - savedTimestamp) / (1000 * 60 * 60 * 24))} days old`);
                }
            }

            // No data available at all
            if (!timings) {
                const errorMsg = tr("labels.noPrayerTimes")
                setPrayersError(errorMsg);
                console.warn("⚠️", errorMsg);
            }

            // Update state
            setPrayerTimes(timings);
            lastFetchedDate.current = new Date().toLocaleString("en-GB");
        } catch (err) {
            console.warn("⚠️ Failed to load prayer times:", err);
            setPrayersError(err.message);
            setPrayerTimes(null);
        } finally {
            setPrayersLoading(false);
            isLoadingRef.current = false;
        }
    };

    // ------------------------------------------------------------
    // Determine location to use
    // ------------------------------------------------------------
    const resolveLocation = async () => {
        if (appSettings?.location && deviceSettings?.locationPermission) {
            return appSettings.location;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            Alert.alert(tr("labels.locationDenied"), tr("labels.locationDeniedMessage"));
            return null;
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
            return null;
        }

        // Save new settings
        await saveAppSettings({
            location: loc.coords,
            fullAddress: await formatUserAddress(loc.coords),
            timeZone: await getTimeZoneInfo(loc.coords),
        });

        console.log("📍 Prayer times updated Location to:", loc.coords);
        return loc.coords;
    };

    // ------------------------------------------------------------
    // Manual save
    // ------------------------------------------------------------
    const savePrayerTimes = useCallback(async (newTimes) => {
        if (!newTimes) return;

        const success = await saveToStorage(newTimes);
        if (success) {
            setPrayerTimes(newTimes);
            lastFetchedDate.current = new Date().toLocaleString("en-GB");
            setPrayersOutdated(false);
            console.log("✅ Prayer times saved manually");
        }
    }, []);

    // ------------------------------------------------------------
    // Reload prayer times
    // ------------------------------------------------------------
    const reloadPrayerTimes = useCallback(async () => {
        if (!appSettings?.location || !deviceSettings?.locationPermission) {
            await resolveLocation();
        }
        await loadPrayerTimes();
    }, [appSettings?.location, deviceSettings?.locationPermission]);

    // ------------------------------------------------------------
    // Computed value for hasPrayerTimes
    // ------------------------------------------------------------
    const hasPrayerTimes = useMemo(() => {
        return prayerTimes && typeof prayerTimes === 'object' && Object.keys(prayerTimes).length > 0;
    }, [prayerTimes]);

    // ------------------------------------------------------------
    // Auto-load on mount / settings changes
    // ------------------------------------------------------------
    useEffect(() => {
        if (!settingsLoading && appSettings?.location) {
            loadPrayerTimes();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settingsLoading, appSettings?.location]);

    // ------------------------------------------------------------
    // Memoize context value to prevent unnecessary re-renders
    // ------------------------------------------------------------
    const contextValue = useMemo(() => ({
        prayerTimes,
        hasPrayerTimes,
        savePrayerTimes,
        prayersLoading,
        prayersError,
        prayersOutdated,
        lastFetchedDate: lastFetchedDate.current,
        reloadPrayerTimes,
    }), [prayerTimes, hasPrayerTimes, savePrayerTimes, prayersLoading, prayersError, prayersOutdated, reloadPrayerTimes]);

    return (
        <PrayersContext.Provider value={contextValue}>
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