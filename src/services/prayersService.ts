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
        // Dynamically choose calculation method based on latitude
        let method: number = 2; // fallback ISNA
        let methodSettings: string | null = null;
        let tune: string | null = null;

        // Approximate Europe / Balkans regions
        if (latitude >= 41 && latitude <= 50) {
            method = 13; // Turkey Diyanet default
            tune = "1,55,0,0,0,0,0,0,0"; // example: +1 min Imsak, +55 min Fajr

            // Southern Balkans: Albania, Kosovo, Bosnia, Macedonia (~41-44°)
            if (latitude < 44) {
                method = 99;
                methodSettings = "15,null,17"; // Fajr 15°, Isha 17°
            }
        }

        // Build API URL
        let url = `https://api.aladhan.com/v1/calendar/${year}?latitude=${latitude}&longitude=${longitude}&method=${method}`;
        if (method === 99 && methodSettings) {
            url += `&methodSettings=${encodeURIComponent(methodSettings)}`;
        }
        if (tune) {
            url += `&tune=${encodeURIComponent(tune)}`;
        }

        // Fetch yearly calendar with AbortController (30s timeout for larger payload)
        const controller = new AbortController();
        timeout = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(url, { signal: controller.signal });

        // Check if response is ok
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Get the results
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

        console.log(`✅ [prayersService] Fetched prayer times for ${Object.keys(prayerTimes).length} days for ${year} from API`);

        return prayerTimes;

    } catch (err) {
        console.warn("❌ [prayersService] Yearly fetch error:", err);
        throw err;
    } finally {
        clearTimeout(timeout);
    }
}