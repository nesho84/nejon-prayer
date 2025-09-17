import * as Location from "expo-location";

export async function formatTimezone(location) {
    try {
        // 1. Reverse geocode → get human-readable address
        const [place] = await Location.reverseGeocodeAsync({
            latitude: location.latitude,
            longitude: location.longitude,
        });

        const city = place?.city || place?.region || "";
        const area = place?.district || place?.name || "";
        const country = place?.country || "";

        // 2. Timezone lookup → with Intl.DateTimeFormat
        const now = new Date();
        const userLocale = "en-US"; // or detect from device

        const fullTimeZoneName = new Intl.DateTimeFormat(userLocale, {
            timeZoneName: "long",
        }).formatToParts(now).find((p) => p.type === "timeZoneName")?.value;

        const tzOffset = new Intl.DateTimeFormat("en-US", {
            timeZoneName: "shortOffset",
        }).format(now).split(" ").pop();

        const formattedTime = new Intl.DateTimeFormat(userLocale, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(now);

        return `${fullTimeZoneName}\nTime zone in ${area || city}, ${country} (${tzOffset})\n${formattedTime}`;
    } catch (err) {
        console.error("❌ Location formatting error:", err);
        return new Date().toDateString(); // fallback
    }
}

/**
 * Reverse-geocodes given coordinates into a human-readable string.
 *
 * @param {Object} location - { latitude, longitude }
 * @returns {Promise<string|null>} - Formatted address or null if failed
 */
export async function reverseGeocode(location) {
    try {
        if (!location?.latitude || !location?.longitude) {
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
        console.error("Reverse geocoding error:", err);
        return null;
    }
}