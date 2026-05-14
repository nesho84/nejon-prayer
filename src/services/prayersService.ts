import { AppLocation } from '@/types/location.types';
import { PrayerName, PrayerTimes, YearlyPrayerTimes } from '@/types/prayer.types';

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

// Prayers we care about — others (Sunset, Midnight, etc.) are excluded
const PRAYER_NAMES: PrayerName[] = ["Imsak", "Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];

// Method 3: Muslim World League (MWL)
// The most widely accepted global baseline, used by major worldwide prayer apps.
// Consistent and predictable for all coordinates — avoids unpredictable auto-detection
// which picks by geographic proximity and can apply wrong regional authorities
// (e.g. French UOIF parameters for Vienna instead of Turkish Diyanet).
const ALADHAN_METHOD = 3;

// Latitude Adjustment Method 2: One Seventh of the Night
// Required for high-latitude regions (Europe, Canada, northern US, Russia, etc.)
// where standard angle-based Fajr/Isha calculation breaks down in summer due to
// persistent twilight. ONE_SEVENTH divides the night into 7 equal parts and
// derives Fajr/Isha proportionally. Has zero effect at normal latitudes —
// angle-based calculation is used as-is there.
const ALADHAN_LATITUDE_ADJUSTMENT = 2;

// ------------------------------------------------------------
// TODO: Future — User Calculation Preferences (Advanced Settings)
// ------------------------------------------------------------
// Allow advanced users to override the default calculation settings:
//
// 1. Calculation Method: Default is MWL (3). Users could select their local
//    authority (e.g. Diyanet for Turkey, Egyptian for Egypt, etc.) to match
//    their neighborhood mosque exactly.
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
export async function getYearlyPrayerTimes(location: AppLocation, year: number): Promise<YearlyPrayerTimes> {
    const { latitude, longitude } = location;

    // Validate coordinates
    if (typeof latitude !== "number" || typeof longitude !== "number") {
        console.error("❌ Invalid location:", location);
        throw new Error("Invalid location coordinates");
    }

    // AbortController timeout reference
    let timeout: ReturnType<typeof setTimeout> | undefined;

    try {
        // Aldhan API URL with query parameters for method, location, and optional tuning
        const url = `https://api.aladhan.com/v1/calendar/${year}?latitude=${latitude}&longitude=${longitude}&method=${ALADHAN_METHOD}&latitudeAdjustmentMethod=${ALADHAN_LATITUDE_ADJUSTMENT}`;

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
                PRAYER_NAMES.forEach((key) => {
                    if (day.timings[key]) {
                        filtered[key] = day.timings[key].split(" ")[0];
                    }
                });

                prayerTimes[isoDate] = filtered as PrayerTimes;
            });
        });

        console.log(`✅ [prayersService] Fetched prayer times for ${Object.keys(prayerTimes).length} days for ${year} from Aladhan API`);

        return prayerTimes;

    } catch (err) {
        console.warn("❌ [prayersService] Yearly fetch error:", err);
        throw err;
    } finally {
        clearTimeout(timeout);
    }
}