import { useEffect, useState } from "react";

export default function useNextPrayer(prayerTimes) {
    const [nextPrayerName, setNextPrayerName] = useState(null);
    const [nextPrayerTime, setNextPrayerTime] = useState(null);
    const [prayerCountdown, setPrayerCountdown] = useState({});
    const [remainingSeconds, setRemainingSeconds] = useState(null);
    const [totalSeconds, setTotalSeconds] = useState(null);

    // ------------------------------------------------------------
    // Format time with leading zeros
    // ------------------------------------------------------------
    const pad = n => String(n).padStart(2, "0");

    // ------------------------------------------------------------
    // Find next prayer and setup countdown
    // ------------------------------------------------------------
    const updateNextPrayer = () => {
        if (!prayerTimes) return;

        const now = new Date();
        let upcoming = null;

        const PRAYER_ORDER_SHORT = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
        for (const name of PRAYER_ORDER_SHORT) {
            if (!prayerTimes[name]) continue; // skip if missing

            const [hour, minute] = prayerTimes[name].split(":").map(Number);
            const prayerDate = new Date();
            prayerDate.setHours(hour, minute, 0, 0);

            if (prayerDate > now) {
                upcoming = { name: name, time: prayerDate };
                break; // stop at first upcoming prayer
            }
        }

        // If no more today, pick tomorrow's Fajr
        if (!upcoming && prayerTimes["Fajr"]) {
            const [hour, minute] = prayerTimes["Fajr"].split(":").map(Number);
            const tomorrowFajr = new Date();
            tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
            tomorrowFajr.setHours(hour, minute, 0, 0);
            upcoming = { name: "Fajr", time: tomorrowFajr };
        }

        if (!upcoming) return;

        setNextPrayerName(upcoming.name);
        setNextPrayerTime(upcoming.time);

        const diffMs = upcoming.time - now;
        const diffSec = Math.floor(diffMs / 1000);

        setRemainingSeconds(diffSec);
        setTotalSeconds(diffSec); // freeze "full duration" for progress

        const hours = pad(Math.floor(diffSec / 3600));
        const minutes = pad(Math.floor((diffSec % 3600) / 60));
        const seconds = pad(diffSec % 60);

        setPrayerCountdown({ hours, minutes, seconds });
    };

    // ------------------------------------------------------------
    // Start interval ticking every second
    // ------------------------------------------------------------
    useEffect(() => {
        if (!prayerTimes) return;

        updateNextPrayer(); // initial tick

        const interval = setInterval(() => {
            setRemainingSeconds((prev) => {
                if (prev === null) return null;
                const newVal = prev > 0 ? prev - 1 : 0;

                // Update formatted countdown too
                const hours = pad(Math.floor(newVal / 3600));
                const minutes = pad(Math.floor((newVal % 3600) / 60));
                const seconds = pad(newVal % 60);
                setPrayerCountdown({ hours, minutes, seconds });

                return newVal;
            });
        }, 1000)

        return () => clearInterval(interval);
    }, [prayerTimes]);

    return { nextPrayerName, nextPrayerTime, prayerCountdown, remainingSeconds, totalSeconds };
}