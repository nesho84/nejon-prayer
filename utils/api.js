export async function fetchPrayerTimes(lat, lon) {
    try {
        const method = 2; // ISNA
        const now = new Date();
        const url = `https://api.aladhan.com/v1/timings/${Math.floor(now.getTime() / 1000)}?latitude=${lat}&longitude=${lon}&method=${method}`;
        const resp = await fetch(url);
        const data = await resp.json();
        // console.log("Prayer times data", data);
        return data.data.timings;
    } catch (err) {
        console.error("Prayer times fetch error", err);
        return null;
    }
}
