import * as Location from "expo-location";

// ------------------------------------------------------------
// Internal shared helper for reverse-geocoding
// ------------------------------------------------------------
async function getReverseGeocode(location) {
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

    // Perform reverse geocode
    const [place] = await Location.reverseGeocodeAsync({
        latitude: location.latitude,
        longitude: location.longitude,
    });

    return place || null;
}

// ------------------------------------------------------------
// Get timezone and location information from device coordinates
// ------------------------------------------------------------
export async function getTimeZoneInfo(location) {
    try {
        const place = await getReverseGeocode(location);
        if (!place) return null;

        const city = place.city || place.region || "";
        const country = place.country || "";

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
        };
    } catch (err) {
        console.error("❌ Failed to get timezone information:", err);
        return null;
    }
}

// ------------------------------------------------------------
// Reverse-geocodes given coordinates into a human-readable Address
// ------------------------------------------------------------
export async function formatAddress(location) {
    try {
        const loc = await getReverseGeocode(location);
        if (!loc) return null;

        const fullAddress = [
            loc.street,
            loc.name,
            loc.postalCode,
            loc.city,
            loc.country,
        ].filter(Boolean).join(", ");

        return fullAddress;
    } catch (err) {
        console.error("❌ Reverse geocoding error:", err);
        return null;
    }
}
