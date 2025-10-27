import { Alert, Linking } from 'react-native';
import * as Location from 'expo-location';
import NetInfo from "@react-native-community/netinfo";

// ------------------------------------------------------------
// Get user's current location with address and timezone information
// ------------------------------------------------------------
export async function getUserLocation(tr = null) {
    try {
        // Request location permission first
        const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
            // If denied permanently, show alert to open settings
            if (!canAskAgain) {
                Alert.alert(
                    tr ? tr("labels.locationAccessTitle") : "Enable Location Access",
                    tr ? tr("labels.locationAccessMessage") : "Location access is required to show accurate prayer times. Please enable it in your device settings.",
                    [
                        { text: tr ? tr("buttons.cancel") : "Cancel", style: "cancel" },
                        {
                            text: tr ? tr("buttons.openSettings") : "Open Settings",
                            onPress: () => Linking.openSettings(),
                        },
                    ],
                    { cancelable: true }
                );
            } else {
                // Temporarily denied but can ask again
                Alert.alert(
                    tr ? tr("labels.locationDeniedTitle") : "Location Access Needed",
                    tr ? tr("labels.locationDeniedMessage") : "Please allow location access to detect your city and display the correct prayer times."
                );
            }
            return null;
        }

        // Check internet connectivity first
        const { isConnected } = await NetInfo.fetch();

        // GPS without Internet access
        if (!isConnected) {
            Alert.alert(
                tr ? tr("labels.gpsOfflineWarningTitle") : "No Internet Connection",
                tr ? tr("labels.gpsOfflineWarningMessage") : "Without internet, GPS may take several minutes and only works outdoors.\n\nFor faster results, connect to internet first.",
            );
        }

        // Adjust accuracy and timeout based on connectivity
        const locationOptions = isConnected
            ? {
                accuracy: Location.Accuracy.Highest,
                timeout: 8000,
            }
            : {
                accuracy: Location.Accuracy.Balanced, // Use Balanced offline
                timeout: 15000, // Give more time for pure GPS fix
                maximumAge: 10000, // Allow cached location up to 10s old
            };

        // Get current position with single attempt
        let loc;
        try {
            loc = await Location.getCurrentPositionAsync(locationOptions);
        } catch (error) {
            // Final fallback: try with last known location
            loc = await Location.getLastKnownPositionAsync({
                maxAge: 60000, // Accept location up to 1 minute old
                requiredAccuracy: 100, // Within 100 meters
            });
        }

        if (!loc?.coords) {
            const title = tr ? tr("labels.error") : "Error";
            const message = tr ? tr("labels.locationError") : "Failed to get location.";
            Alert.alert(title, message);
            return null;
        }

        // Get address and timezone info (already handles offline gracefully)
        const fullAddress = await formatUserAddress(loc.coords);
        const timeZone = await getTimeZoneInfo(loc.coords);

        return {
            location: loc.coords,
            fullAddress,
            timeZone,
        };
    } catch (err) {
        console.warn('❌ Location error:', err);
        const title = tr ? tr("labels.error") : "Error";
        const message = tr ? tr("labels.locationError") : "Failed to get location.";
        Alert.alert(title, message);
        return null;
    }
}

// ------------------------------------------------------------
// Detects if user's location, address, or timezone has changed
// ------------------------------------------------------------
export const hasLocationChanged = (appSettings, newData) => {
    const current = appSettings?.location;

    const LAT_LON_THRESHOLD = 0.00005; // roughly 5 meters

    // Compare coordinates individually to detect changes
    const hasChanged = !current
        || Math.abs(current.latitude - newData.location.latitude) > LAT_LON_THRESHOLD
        || Math.abs(current.longitude - newData.location.longitude) > LAT_LON_THRESHOLD;

    // If nothing changed, skip saving and re-rendering
    if (!hasChanged
        && appSettings?.fullAddress === newData.fullAddress
        && JSON.stringify(appSettings?.timeZone) === JSON.stringify(newData.timeZone)) {
        return false; // unchanged
    }

    return true; // changed
};

// ------------------------------------------------------------
// Helper: for reverse-geocoding
// ------------------------------------------------------------
async function fetchReverseGeocode(location) {
    // Validate location services
    const locationEnabled = await Location.hasServicesEnabledAsync();
    if (!locationEnabled) {
        console.warn("⚠️ Location services are disabled");
        return null;
    }

    if (!location?.latitude || !location?.longitude) {
        console.warn("⚠️ Invalid location coordinates", location);
        return null;
    }

    // Check connectivity
    const { isConnected } = await NetInfo.fetch();
    if (!isConnected) {
        console.log("🌐 Offline mode — skipping reverse geocoding");
        return null;
    }

    try {
        // Perform reverse geocode
        const [place] = await Location.reverseGeocodeAsync({
            latitude: location.latitude,
            longitude: location.longitude,
        });
        return place || null;
    } catch (err) {
        console.warn("⚠️ Reverse geocoding failed:", err);
        return null;
    }
}

// ------------------------------------------------------------
// Get timezone and location information (works offline too)
// ------------------------------------------------------------
export async function getTimeZoneInfo(location) {
    try {
        const place = await fetchReverseGeocode(location);

        const city = place?.city || place?.region || "";
        const country = place?.country || "";

        // Timezone works offline
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const now = new Date();

        const zoneName =
            new Intl.DateTimeFormat("en-GB", {
                timeZone: timezone,
                timeZoneName: "long",
            }).formatToParts(now).find((part) => part.type === "timeZoneName")?.value || "";

        const offset =
            new Intl.DateTimeFormat("en-GB", {
                timeZone: timezone,
                timeZoneName: "shortOffset",
            }).format(now).split(" ").pop() || "";

        const locationName = [city, country].filter(Boolean).join(", ");

        return {
            timezone,               // "Europe/Berlin"
            zoneName,               // "Central European Summer Time"
            offset,                 // "GMT+2"
            city,                   // "Vienna"
            country,                // "Austria"
            location: locationName, // "Vienna, Austria"
            offline: !place, // mark if we were offline
        };
    } catch (err) {
        console.error("❌ Failed to get timezone information:", err);
        return null;
    }
}

// ------------------------------------------------------------
// Reverse-geocodes given coordinates into a human-readable Address
// ------------------------------------------------------------
export async function formatUserAddress(location) {
    try {
        const place = await fetchReverseGeocode(location);

        if (!place) {
            // Offline fallback
            const { latitude, longitude } = location;
            return `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;
        }

        const fullAddress = [
            place.street,
            place.name,
            place.postalCode,
            place.city,
            place.country,
        ].filter(Boolean).join(", ");

        return fullAddress;
    } catch (err) {
        console.error("❌ Reverse geocoding error:", err);
        return null;
    }
}
