import { useEffect, useState } from "react";

export default function usePrayerService(lat, lon) {
    const [loading, setLoading] = useState(true);
    const [timesError, setTimesError] = useState(false);
    const [prayerTimes, setPrayerTimes] = useState(null);
    const [nextPrayerName, setNextPrayerName] = useState(null);
    const [nextPrayerTime, setNextPrayerNameTime] = useState(null); // not used ??
    const [prayerCountdown, setPrayerCountdown] = useState("No more prayers today");

    // ---- Helpers ----
    const fetchPrayerTimes = async (lat, lon) => {
        // // TEMP: simulate error for testing retry button
        // if (!lat || !lon || Math.random() < 1) { // always fail
        //     throw new Error("Simulated fetch error");
        // }

        const now = new Date();
        const timestamp = Math.floor(now.getTime() / 1000);
        const url = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${lat}&longitude=${lon}&method=2`;

        const resp = await fetch(url);
        const data = await resp.json();
        const allTimes = data.data.timings;

        // Parse Fajr
        let [fajrH, fajrM] = allTimes["Fajr"].split(":").map(Number);
        const fajrDate = new Date();
        fajrDate.setHours(fajrH, fajrM);

        // Imsak = Fajr - 20 min
        const imsakDate = new Date(fajrDate);
        imsakDate.setMinutes(fajrDate.getMinutes() - 20);

        // Ensure Fajr is at least 25 min after Imsak
        const diffMinutes = (fajrDate - imsakDate) / 60000;
        if (diffMinutes < 25) {
            fajrDate.setMinutes(imsakDate.getMinutes() + 5);
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
    };

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
