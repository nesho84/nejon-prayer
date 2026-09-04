import { AppLocation } from '@/types/location.types';
import { ALL_PRAYERS, PrayerTimes, YearlyPrayerTimes } from '@/types/prayer.types';

interface AladhanTimings {
    [key: string]: string;
}

interface AladhanDayData {
    timings: AladhanTimings;
    date: {
        gregorian: {
            date: string; // "01-01-2026"
        };
    };
}

interface AladhanCalendarResponse {
    data?: Record<string, AladhanDayData[]>; // { "1": [...], "2": [...], ... }
}

// Latitude Adjustment Method 2: One Seventh of the Night — divides the night into 7 equal
// parts and derives Fajr/Isha proportionally. Needed at high latitudes (Europe, Canada,
// northern US, Russia) where persistent summer twilight breaks the angle-based calculation.
// No effect at normal latitudes, where angle-based is used as-is.
const ALADHAN_LATITUDE_ADJUSTMENT = 2;

// ------------------------------------------------------------
// Country → Aladhan calculation method, by closest Islamic authority per region.
// Only non-MWL countries are listed; everything else falls back to MWL (3).
// ------------------------------------------------------------
const COUNTRY_METHOD_MAP: Record<string, number> = {
    // North Africa
    EG: 5,  // Egypt — Egyptian General Authority
    LY: 5,  // Libya
    SD: 5,  // Sudan
    DZ: 19, // Algeria
    TN: 18, // Tunisia
    MA: 21, // Morocco
    // Middle East
    SA: 4,  // Saudi Arabia — Umm Al-Qura
    AE: 16, // UAE — IACAD (Dubai)
    KW: 9,  // Kuwait
    QA: 10, // Qatar
    BH: 8,  // Bahrain — Gulf Region
    OM: 8,  // Oman — Gulf Region
    JO: 23, // Jordan
    IR: 7,  // Iran — Tehran
    SY: 5,  // Syria — Egyptian
    LB: 5,  // Lebanon — Egyptian
    // East Africa (Horn)
    SO: 5,  // Somalia — Egyptian
    DJ: 5,  // Djibouti — Egyptian
    // South Asia
    PK: 1,  // Pakistan — Karachi
    IN: 1,  // India — Karachi
    BD: 1,  // Bangladesh — Karachi
    AF: 1,  // Afghanistan — Karachi
    // Southeast Asia
    MY: 17, // Malaysia — JAKIM
    BN: 17, // Brunei — JAKIM
    SG: 11, // Singapore — MUIS
    ID: 20, // Indonesia — Kemenag
    // Diyanet method (13) — Turkey, Balkans & European diaspora
    TR: 13, // Turkey — Diyanet
    AT: 13, // Austria
    DE: 13, // Germany
    NL: 13, // Netherlands
    BE: 13, // Belgium
    CH: 13, // Switzerland
    BA: 13, // Bosnia
    XK: 13, // Kosovo
    AL: 13, // Albania
    MK: 13, // North Macedonia
    ME: 13, // Montenegro
    RS: 13, // Serbia
    // Western Europe
    GB: 15, // UK — Moonsighting Committee Worldwide
    FR: 12, // France — UOIF
    PT: 22, // Portugal
    // Russia & Central Asia
    RU: 14, // Russia
    KZ: 14, // Kazakhstan
    UZ: 1,  // Uzbekistan — Karachi
    TJ: 1,  // Tajikistan — Karachi
    TM: 1,  // Turkmenistan — Karachi
    KG: 1,  // Kyrgyzstan — Karachi
    // North America
    US: 2,  // USA — ISNA
    CA: 2,  // Canada — ISNA
};

// Get calculation method for a given country code, with safe fallback
export function getMethodForCountry(countryCode: string | null | undefined): number {
    if (!countryCode) return 3; // fallback to MWL

    const normalizedCode = countryCode.trim().toUpperCase();

    // Explicitly return mapped ID, or fallback to MWL (3)
    return COUNTRY_METHOD_MAP[normalizedCode] ?? 3;
}

// ------------------------------------------------------------
// @TODO: Future — User Calculation Preferences (Advanced Settings)
// ------------------------------------------------------------
// Let advanced users override the three defaults above — stored in Zustand/MMKV and
// passed into getYearlyPrayerTimes() instead of the constants:
//
//   1. Calculation Method — per-country map today; let users pick their local authority
//      (Diyanet for Turkey, Egyptian for Egypt, …) to match their own mosque.
//   2. Latitude Adjustment — ONE_SEVENTH (2) today; expose ANGLE_BASED (3) and
//      MIDDLE_OF_NIGHT (1).
//   3. Asr School — Standard/Shafi (0) today; toggle to Hanafi (1) for South Asia
//      (Pakistan, India, Bangladesh).
//
// Any change needs a cache invalidation (bump the storage key or reset fetchedYear).
// ------------------------------------------------------------

// ------------------------------------------------------------
// Fetch a full year of prayer times from aladhan.com — once per year, on first app
// start and on location change. Returns a flat { "YYYY-MM-DD": PrayerTimes } map.
// ------------------------------------------------------------
export async function getYearlyPrayerTimes(location: AppLocation, year: number, countryCode: string): Promise<YearlyPrayerTimes> {
    const { latitude, longitude } = location;

    // Validate coordinates
    if (typeof latitude !== "number" || typeof longitude !== "number") {
        console.error("❌ Invalid location:", location);
        throw new Error("Invalid location coordinates");
    }

    // AbortController timeout reference
    let timeout: ReturnType<typeof setTimeout> | undefined;

    try {
        // Select calculation method based on country code (fallback to MWL if unknown)
        const method = getMethodForCountry(countryCode);

        // Aladhan API URL with method selected by country and ONE_SEVENTH latitude adjustment
        const url = `https://api.aladhan.com/v1/calendar/${year}?latitude=${latitude}&longitude=${longitude}&method=${method}&latitudeAdjustmentMethod=${ALADHAN_LATITUDE_ADJUSTMENT}`;

        // Fetch yearly calendar with AbortController (30s timeout for larger payload)
        const controller = new AbortController();
        timeout = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Get JSON response
        const result: AladhanCalendarResponse = await response.json();

        // Validate response structure
        if (!result?.data) {
            throw new Error("Invalid API response structure");
        }

        // Flatten months/days { "1": [...], "2": [...] } into { "YYYY-MM-DD": PrayerTimes }
        // Calendar endpoint returns timings with timezone suffix e.g. "06:10 (CET)" — strip to "06:10"
        const prayerTimes: YearlyPrayerTimes = {};

        Object.values(result.data).forEach((month) => {
            month.forEach((day) => {
                // Convert Aladhan date format "01-01-2026" → "2026-01-01"
                const [d, m, y] = day.date.gregorian.date.split("-");
                const isoDate = `${y}-${m}-${d}`;

                // Filter to only needed prayers and strip timezone suffix
                const filtered: Partial<PrayerTimes> = {};
                ALL_PRAYERS.forEach((key) => {
                    if (day.timings[key]) {
                        filtered[key] = day.timings[key].split(" ")[0];
                    }
                });

                prayerTimes[isoDate] = filtered as PrayerTimes;
            });
        });

        console.log(`✅ [prayersService] Fetched prayer times for ${Object.keys(prayerTimes).length} days for ${year} (method ${method}, countryCode: ${countryCode || 'unknown'}) from Aladhan API`);

        return prayerTimes;

    } catch (err) {
        console.warn("❌ [prayersService] Yearly fetch error:", err);
        throw err;
    } finally {
        clearTimeout(timeout);
    }
}
