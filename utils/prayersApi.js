// ------------------------------------------------------------
// Fetch prayer times from aladhan.com API
// ------------------------------------------------------------
export async function getPrayerTimes(location) {
    const { latitude, longitude } = location;

    try {
        // 1. Determine timezone dynamically
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // 2. Compute today's timestamp in user's local timezone
        const now = new Date();
        const localToday = new Date(now.toLocaleString("en-US", { timeZone: tz }));
        localToday.setHours(0, 0, 0, 0);
        const timestamp = Math.floor(localToday.getTime() / 1000);

        // 3. Dynamically choose calculation method based on latitude
        let method = 2; // fallback ISNA
        let methodSettings = null;
        let tune = null;

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

        // 4. Build API URL
        let url = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${latitude}&longitude=${longitude}&method=${method}`;
        if (method === 99 && methodSettings) url += `&methodSettings=${encodeURIComponent(methodSettings)}`;
        if (tune) url += `&tune=${encodeURIComponent(tune)}`;

        // 5. Fetch prayer times
        const response = await fetch(url);
        const result = await response.json();
        // console.log("aladhan api response:", JSON.stringify(result, null, 2));

        let timings = result.data.timings;

        // Custom prayers order
        const PRAYER_ORDER_FULL = ["Imsak", "Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
        const filtered = {};
        PRAYER_ORDER_FULL.forEach((key) => {
            if (timings[key]) filtered[key] = timings[key];
        });

        return filtered; // { Fajr: "06:00", Dhuhr: "12:50", ... }
    } catch (err) {
        console.error("❌ API fetch error:", err);
        return null;
    }
}
