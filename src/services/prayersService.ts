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

// Latitude Adjustment Method 2: One Seventh of the Night
// Required for high-latitude regions (Europe, Canada, northern US, Russia, etc.)
// where standard angle-based Fajr/Isha calculation breaks down in summer due to
// persistent twilight. ONE_SEVENTH divides the night into 7 equal parts and
// derives Fajr/Isha proportionally. Has zero effect at normal latitudes —
// angle-based calculation is used as-is there.
const ALADHAN_LATITUDE_ADJUSTMENT = 2;

// ------------------------------------------------------------
// Country → Aladhan calculation method mapping
// Based on the closest Islamic authority per region.
// Falls back to MWL (3) for unlisted countries.
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
    AE: 16, // UAE — Dubai
    KW: 9,  // Kuwait
    QA: 10, // Qatar
    BH: 8,  // Bahrain — Gulf Region
    OM: 8,  // Oman
    IQ: 3,  // Iraq — MWL
    SY: 3,  // Syria
    JO: 23, // Jordan
    LB: 3,  // Lebanon
    PS: 3,  // Palestine
    YE: 3,  // Yemen
    IR: 7,  // Iran — Tehran
    // South Asia
    PK: 1,  // Pakistan — Karachi
    IN: 1,  // India
    BD: 1,  // Bangladesh
    AF: 1,  // Afghanistan
    // Southeast Asia
    MY: 17, // Malaysia — JAKIM
    SG: 11, // Singapore
    ID: 20, // Indonesia — Kemenag
    // Turkey & Balkans + Europe (Turkish/Diyanet community)
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
    FR: 12, // France — UOIF
    PT: 22, // Portugal
    // Russia & Central Asia
    RU: 14, // Russia
    KZ: 14, // Kazakhstan
    UZ: 1,  // Uzbekistan — Karachi
    TJ: 1,  // Tajikistan
    TM: 1,  // Turkmenistan
    KG: 1,  // Kyrgyzstan
    // North America
    US: 2,  // USA — ISNA
    CA: 2,  // Canada
    // Oceania
    AU: 3,  // Australia — MWL
    NZ: 3,  // New Zealand
};

// Helper to get calculation method for a given country code, with fallback
function getMethodForCountry(countryCode: string): number {
    return COUNTRY_METHOD_MAP[countryCode] ?? 3; // fallback to MWL
}

// ------------------------------------------------------------
// TODO: Future — User Calculation Preferences (Advanced Settings)
// ------------------------------------------------------------
// Allow advanced users to override the default calculation settings:
//
// 1. Calculation Method: Default is per-country map above. Users could select
//    their local authority (e.g. Diyanet for Turkey, Egyptian for Egypt, etc.)
//    to match their neighborhood mosque exactly.
//
// 2. Latitude Adjustment: Default is ONE_SEVENTH (2). Could be exposed for
//    users who prefer ANGLE_BASED (3) or MIDDLE_OF_NIGHT (1).
//
// 3. Asr School: Default is Standard/Shafi (school=0). Should be toggleable
//    to Hanafi (school=1) for users in South Asia (Pakistan, India, Bangladesh).
//
// These preferences would be stored in Zustand/MMKV and passed into the
// getYearlyPrayerTimes() call, replacing the constants above.
// A cache invalidation (bump storage key or reset fetchedYear) would be
// required whenever the user changes any of these settings.
// ------------------------------------------------------------

// ------------------------------------------------------------
// Fetch yearly prayer times from aladhan.com API
// Fetched once per year, on first app start and on location change.
// Returns a flat map of { "YYYY-MM-DD": PrayerTimes } for all 365 days.
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