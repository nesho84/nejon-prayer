const PRAYER_ORDER = ["Imsak", "Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];

export async function fetchPrayerTimes(lat, lon) {
    // return null;
    try {
        const method = 2; // ISNA
        const now = new Date();

        const url = `https://api.aladhan.com/v1/timings/
        ${Math.floor(now.getTime() / 1000)}?latitude=${lat}&longitude=${lon}&method=${method}`;

        const resp = await fetch(url);
        const data = await resp.json();
        const allTimes = data.data.timings;

        // Filter & order once here
        const filtered = {};
        PRAYER_ORDER.forEach((key) => {
            if (allTimes[key]) {
                filtered[key] = allTimes[key];
            }
        });

        return filtered;
    } catch (err) {
        console.error("Prayer times fetch error", err);
        return null;
    }
}