// export async function fetchPrayerTimes(lat, lon) {
//     try {
//         const now = new Date();
//         const timestamp = Math.floor(now.getTime() / 1000);

//         // Adjust Fajr angle based on latitude for realistic times
//         let fajrAngle = 18; // default ISNA
//         const absLat = Math.abs(lat);

//         if (absLat >= 50) {
//             fajrAngle = 19.5; // very northern locations
//         } else if (absLat >= 45) {
//             fajrAngle = 19;   // mid-high latitudes, e.g., Vienna
//         }

//         // Aladhan API call with dynamic fajr angle
//         const url = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${lat}&longitude=${lon}&method=2&adjustmentFajr=${fajrAngle}`;

//         const resp = await fetch(url);
//         const data = await resp.json();
//         const allTimes = data.data.timings;

//         // Filter and order the times
//         const PRAYER_ORDER_FULL = ["Imsak", "Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
//         const filtered = {};
//         PRAYER_ORDER_FULL.forEach((key) => {
//             if (allTimes[key]) filtered[key] = allTimes[key];
//         });

//         return filtered;
//     } catch (err) {
//         console.error("Prayer times fetch error:", err);
//         return null;
//     }
// }

// export async function fetchPrayerTimes(lat, lon) {
//     try {
//         const now = new Date();
//         const timestamp = Math.floor(now.getTime() / 1000);

//         // Fetch prayer times from Aladhan API
//         const url = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${lat}&longitude=${lon}&method=2`;
//         const resp = await fetch(url);
//         const data = await resp.json();
//         const allTimes = data.data.timings;

//         // Parse Imsak and Fajr
//         const [imsakH, imsakM] = allTimes["Imsak"].split(":").map(Number);
//         const [fajrH, fajrM] = allTimes["Fajr"].split(":").map(Number);

//         const imsakDate = new Date();
//         imsakDate.setHours(imsakH, imsakM);

//         const fajrDate = new Date();
//         fajrDate.setHours(fajrH, fajrM);

//         // Calculate difference in minutes
//         let diffMinutes = (fajrDate - imsakDate) / 60000;
//         // Minimum realistic interval (e.g., 50–60 min)
//         const minInterval = 50;
//         if (diffMinutes < minInterval) {
//             // Increase Fajr just enough to reach minInterval
//             fajrDate.setMinutes(imsakDate.getMinutes() + minInterval);
//         }

//         const correctedFajr = `${fajrDate.getHours().toString().padStart(2, "0")}:${fajrDate.getMinutes().toString().padStart(2, "0")}`;

//         // Define prayer order
//         const PRAYER_ORDER_FULL = ["Imsak", "Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];

//         // Build final filtered object
//         const filtered = {};
//         PRAYER_ORDER_FULL.forEach((key) => {
//             if (key === "Fajr") filtered[key] = correctedFajr;
//             else if (allTimes[key]) filtered[key] = allTimes[key];
//         });

//         return filtered;
//     } catch (err) {
//         console.error("Prayer times fetch error:", err);
//         return null;
//     }
// }

export async function fetchPrayerTimes(lat, lon) {
    try {
        const now = new Date();
        const timestamp = Math.floor(now.getTime() / 1000);

        // Fetch prayer times from Aladhan API
        const url = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${lat}&longitude=${lon}&method=2`;
        const resp = await fetch(url);
        const data = await resp.json();
        const allTimes = data.data.timings;

        // Parse Fajr
        let [fajrH, fajrM] = allTimes["Fajr"].split(":").map(Number);
        const fajrDate = new Date();
        fajrDate.setHours(fajrH, fajrM);

        // Imsak = Fajr - 10 min
        const imsakDate = new Date(fajrDate);
        imsakDate.setMinutes(fajrDate.getMinutes() - 10);

        // Ensure Fajr is not too close to Imsak (e.g., at least 50 min)
        const diffMinutes = (fajrDate - imsakDate) / 60000;
        if (diffMinutes < 50) {
            fajrDate.setMinutes(imsakDate.getMinutes() + 50);
        }

        const correctedFajr = `${fajrDate.getHours().toString().padStart(2, "0")}:${fajrDate.getMinutes().toString().padStart(2, "0")}`;
        const correctedImsak = `${imsakDate.getHours().toString().padStart(2, "0")}:${imsakDate.getMinutes().toString().padStart(2, "0")}`;

        // Define prayer order
        const PRAYER_ORDER_FULL = ["Imsak", "Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
        // Build final filtered object
        const filtered = {};
        PRAYER_ORDER_FULL.forEach((key) => {
            if (key === "Fajr") filtered[key] = correctedFajr;
            else if (key === "Imsak") filtered[key] = correctedImsak;
            else if (allTimes[key]) filtered[key] = allTimes[key];
        });

        return filtered;
    } catch (err) {
        console.error("Prayer times fetch error:", err);
        return null;
    }
}