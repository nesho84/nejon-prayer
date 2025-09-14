import { useEffect, useState } from "react";

export default function usePrayerService(lat, lon) {
    const [loading, setLoading] = useState(true);
    const [timesError, setTimesError] = useState(false);
    const [prayerTimes, setPrayerTimes] = useState(null);
    const [nextPrayerName, setNextPrayerName] = useState(null);
    const [nextPrayerTime, setNextPrayerNameTime] = useState(null); // not used ??
    const [prayerCountdown, setPrayerCountdown] = useState("No more prayers today");

    // fetchPrayerTimes
    const fetchPrayerTimes = async (lat, lon) => {
        try {
            const now = new Date();
            const timestamp = Math.floor(now.getTime() / 1000);
            const url = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${lat}&longitude=${lon}&method=2`;

            const resp = await fetch(url);
            const data = await resp.json();
            const allTimes = data.data.timings;

            // Parse Fajr -> Date
            const [fajrH, fajrM] = allTimes["Fajr"].split(":").map(Number);
            const fajrDate = new Date();
            fajrDate.setHours(fajrH, fajrM, 0, 0);

            // Imsak = Fajr - 20 minutes
            const imsakDate = new Date(fajrDate.getTime() - 20 * 60000);

            // Ensure spacing rule (Imsak vs Fajr)
            if ((fajrDate - imsakDate) / 60000 < 25) {
                fajrDate.setMinutes(imsakDate.getMinutes() + 5);
            }

            //  format Date -> "HH:mm" (always 24h, no AM/PM)
            const correctedFajr = `${String(fajrDate.getHours()).padStart(2, "0")}:${String(fajrDate.getMinutes()).padStart(2, "0")}`;
            const correctedImsak = `${String(imsakDate.getHours()).padStart(2, "0")}:${String(imsakDate.getMinutes()).padStart(2, "0")}`;

            // Return final object
            const PRAYER_ORDER_FULL = ["Imsak", "Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
            const filtered = {};
            PRAYER_ORDER_FULL.forEach((key) => {
                if (key === "Fajr") filtered[key] = correctedFajr;
                else if (key === "Imsak") filtered[key] = correctedImsak;
                else if (allTimes[key]) filtered[key] = allTimes[key]; // API is already "HH:mm"
            });

            return filtered; // e.g. { Fajr: "05:46", Dhuhr: "12:50", ... }
        } catch (err) {
            console.error("Prayer times fetch error:", err);
            return null;
        }
    }

    const loadPrayerTimes = async () => {
        setLoading(true);
        setTimesError(false);
        try {
            const data = await fetchPrayerTimes(lat, lon);
            setPrayerTimes(data);
            setLoading(false);
        } catch (err) {
            console.error("Load Prayer times error:", err);
            setPrayerTimes(null);
            setTimesError(true);
            setLoading(false);
        }
    };

    const updateNextPrayer = (times) => {
        if (!times) {
            setNextPrayerName(null);
            setNextPrayerNameTime(null);
            setPrayerCountdown("No more prayers today");
            return;
        }

        const now = new Date();
        let upcoming = null;

        Object.entries(times).forEach(([name, time]) => {
            const [hour, minute] = time.split(":").map(Number);
            const prayerDate = new Date();
            prayerDate.setHours(hour, minute, 0, 0);

            if (prayerDate > now && !upcoming) {
                upcoming = { name, time: prayerDate };
            }
        });

        if (!upcoming && times["Fajr"]) {
            const [hour, minute] = times["Fajr"].split(":").map(Number);
            const tomorrowFajr = new Date();
            tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
            tomorrowFajr.setHours(hour, minute, 0, 0);
            upcoming = { name: "Fajr", time: tomorrowFajr };
        }

        if (!upcoming) {
            setNextPrayerName(null);
            setNextPrayerNameTime(null);
            setPrayerCountdown("No more prayers today");
            return;
        }

        setNextPrayerName(upcoming.name);
        setNextPrayerNameTime(upcoming.time);

        const diff = upcoming.time - now;
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setPrayerCountdown(`${hours}h ${minutes}m ${seconds}s`);
    };

    // ---- Effects ----
    useEffect(() => {
        if (!lat || !lon) return;
        // Fech prayer times
        loadPrayerTimes();
    }, [lat, lon]);

    useEffect(() => {
        if (!prayerTimes) return;
        updateNextPrayer(prayerTimes);

        const interval = setInterval(() => updateNextPrayer(prayerTimes), 1000);
        return () => clearInterval(interval);
    }, [prayerTimes]);

    return {
        loadPrayerTimes,
        prayerTimes,
        nextPrayerName,
        nextPrayerTime,
        prayerCountdown,
        loading,
        timesError,
    };
}
