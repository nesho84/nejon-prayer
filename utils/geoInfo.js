import * as Location from "expo-location";

// ------------------------------------------------------------
// Reverse-geocodes given coordinates into a human-readable timezone.
// ------------------------------------------------------------
export async function formatTimezone(location) {
    try {
        // ✅ Location Permission check
        const locationEnabled = await Location.hasServicesEnabledAsync();
        if (!locationEnabled) {
            console.warn("Location Access Denied");
            return null;
        }

        // ✅ Add safety check at the beginning
        if (!location?.latitude || !location?.longitude) {
            console.warn("formatTimezone: Invalid location provided", location);
            return null;
        }

        // Reverse geocode → get human-readable address
        const [place] = await Location.reverseGeocodeAsync({
            latitude: location.latitude,
            longitude: location.longitude,
        });

        const city = place?.city || place?.region || "";
        const area = place?.district || place?.name || "";
        const country = place?.country || "";

        // Timezone lookup → with Intl.DateTimeFormat
        const now = new Date();
        const userLocale = "en-DE"; // or detect from device

        const fullTimeZoneName = new Intl.DateTimeFormat(userLocale, {
            timeZoneName: "long",
        }).formatToParts(now).find((p) => p.type === "timeZoneName")?.value;

        const tzOffset = new Intl.DateTimeFormat("en-DE", {
            timeZoneName: "shortOffset",
        }).format(now).split(" ").pop();

        return {
            title: fullTimeZoneName,
            subTitle: `Time zone in ${area || city}, ${country} (${tzOffset})`,
        }
    } catch (err) {
        console.error("❌ Location formatting error:", err);
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