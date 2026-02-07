import type { PrayerTimes, PrayerName } from '@/types/prayer.types';

interface Location {
    latitude: number;
    longitude: number;
}

interface AladhanTimings {
    [key: string]: string;
}

interface AladhanResponse {
    data?: {
        timings?: AladhanTimings;
    };
}

// ------------------------------------------------------------
// Fetch prayer times from aladhan.com API
// ------------------------------------------------------------
export async function getPrayerTimes(location: Location): Promise<PrayerTimes> {
    const { latitude, longitude } = location;

    // 1. Validate coordinates
    if (typeof latitude !== "number" || typeof longitude !== "number") {
        console.error("❌ Invalid location:", location);
        throw new Error("Invalid location coordinates");
    }

    try {
        // 2. Determine timezone dynamically
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // 3. Compute today's timestamp in user's local timezone
        const now = new Date();
        const localToday = new Date(now.toLocaleString("en-US", { timeZone: tz }));
        localToday.setHours(0, 0, 0, 0);
        const timestamp = Math.floor(localToday.getTime() / 1000);

        // 4. Dynamically choose calculation method based on latitude
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

        // 5. Build API URL
        let url = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${latitude}&longitude=${longitude}&method=${method}`;
        if (method === 99 && methodSettings) {
            url += `&methodSettings=${encodeURIComponent(methodSettings)}`;
        }
        if (tune) {
            url += `&tune=${encodeURIComponent(tune)}`;
        }

        // 6. Fetch Fetch prayer times with AbortController (10s timeout)
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        // 6.1 Fetch prayer times
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        // 6.2 Check if response is ok
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // 6.3 Get the results
        const result: AladhanResponse = await response.json();

        // 6.4 Validate response structure
        if (!result?.data?.timings) {
            throw new Error("Invalid API response structure");
        }

        let timings = result.data.timings;
        // console.log("aladhan api response:", JSON.stringify(result, null, 2));

        // 7. Return custom prayers
        const PRAYER_ORDER_FULL: PrayerName[] = [
            "Imsak",
            "Fajr",
            "Sunrise",
            "Dhuhr",
            "Asr",
            "Maghrib",
            "Isha"
        ];

        const filtered: Partial<PrayerTimes> = {};
        PRAYER_ORDER_FULL.forEach((key) => {
            if (timings[key]) {
                filtered[key] = timings[key];
            }
        });

        return filtered as PrayerTimes; // { Fajr: "06:00", Dhuhr: "12:50", ... }
    } catch (err) {
        console.error("❌ API fetch error: ", err);
        throw err;
    }
}
