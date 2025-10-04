import * as Location from "expo-location";

// ------------------------------------------------------------
// Get timezone and location information from device coordinates
// ------------------------------------------------------------
export async function getTimeZone(location) {
    try {
        // Validate location services
        const locationEnabled = await Location.hasServicesEnabledAsync();
        if (!locationEnabled) {
            console.warn("Location services are disabled");
            return null;
        }

        if (!location?.latitude || !location?.longitude) {
            console.warn("Invalid location coordinates", location);
            return null;
        }

        // Get location details from coordinates
        const [place] = await Location.reverseGeocodeAsync({
            latitude: location.latitude,
            longitude: location.longitude,
        });

        const city = place?.city || place?.region || "";
        const country = place?.country || "";

        // Get system timezone (actual IANA timezone)
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const now = new Date();

        // Get human-readable timezone name
        const zoneName = new Intl.DateTimeFormat("en-GB", {
            timeZone: timezone,
            timeZoneName: "long",
        }).formatToParts(now).find((part) => part.type === "timeZoneName")?.value || "";

        // Get UTC offset (e.g., "GMT+2")
        const offset = new Intl.DateTimeFormat("en-GB", {
            timeZone: timezone,
            timeZoneName: "shortOffset",
        }).format(now).split(" ").pop() || "";

        // Build location display string
        const locationName = [city, country].filter(Boolean).join(", ");

        return {
            timezone,               // "Europe/Berlin" (IANA timezone)
            zoneName,               // "Central European Summer Time"
            offset,                 // "GMT+2"
            city,                   // "Vienna"
            country,                // "Austria"
            location: locationName, // "Vienna, Austria"
        };
    } catch (err) {
        console.error("❌ Failed to get timezone information:", err);
        return null;
    }
}

// ------------------------------------------------------------
// Reverse-geocodes given coordinates into a human-readable Address.
// ------------------------------------------------------------
export async function formatAddress(location) {
    try {
        // ✅ Location Permission check
        const locationEnabled = await Location.hasServicesEnabledAsync();
        if (!locationEnabled) {
            console.warn("Location Access Denied");
            return null;
        }

        // ✅ Add safety check at the beginning
        if (!location?.latitude || !location?.longitude) {
            console.warn("formatLocation: Invalid location provided", location);
            return null;
        }

        const [loc] = await Location.reverseGeocodeAsync({
            latitude: location.latitude,
            longitude: location.longitude,
        });

        if (!loc) return null;

        // Build a full readable address
        const fullAddress = [
            loc.street,
            loc.name,
            loc.postalCode,
            loc.city,
            loc.country
        ].filter(Boolean).join(", ");

        return fullAddress;
    } catch (err) {
        console.error("❌ Reverse geocoding error:", err);
        return null;
    }
}