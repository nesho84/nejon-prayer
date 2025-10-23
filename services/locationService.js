import { Alert } from 'react-native';
import * as Location from 'expo-location';
import NetInfo from "@react-native-community/netinfo";

// ------------------------------------------------------------
// Get user's current location with address and timezone information
// ------------------------------------------------------------
export async function getUserLocation(tr = null) {
    try {
        // Request location permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            const title = tr ? tr("labels.locationDenied") : "Location needed";
            const message = tr ? tr("labels.locationDeniedMessage") : "Location access is required.";
            Alert.alert(title, message);
            return null;
        }

        // Get current position with fallback from high to balanced accuracy
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
            const title = tr ? tr("labels.error") : "Error";
            const message = tr ? tr("labels.locationError") : "Failed to get location.";
            Alert.alert(title, message);
            return null;
        }

        // Get address and timezone information
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
