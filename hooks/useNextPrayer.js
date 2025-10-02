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
    const pad = (num) => String(num).padStart(2, "0");

    // ------------------------------------------------------------
    // Compute next prayer based on current time
    // ------------------------------------------------------------
    const computeNextPrayer = () => {
        if (!prayerTimes) return;

        // Find next prayer today
        const now = new Date();
        let upcoming = null;

        // loop through prayers in order
        const PRAYER_ORDER_SHORT = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
        for (const name of PRAYER_ORDER_SHORT) {
            if (!prayerTimes[name]) continue; // skip if missing
            // Parse prayer time
            const [hour, minute] = prayerTimes[name].split(":").map(Number);
            const prayerDate = new Date();
            prayerDate.setHours(hour, minute, 0, 0);
            // If prayer time is still upcoming
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

        return upcoming;
    };

    // ------------------------------------------------------------
    // Start interval ticking every second
    // ------------------------------------------------------------
    useEffect(() => {
        if (!prayerTimes) return;

        // initial tick
        const tick = () => {
            // Determine upcoming prayer
            let upcoming = nextPrayerTime ? { name: nextPrayerName, time: nextPrayerTime } : computeNextPrayer();

            // No upcoming prayer found
            if (!upcoming) return;

            // Calculate difference in seconds
            const now = new Date();
            let diffSec = Math.floor((upcoming.time - now) / 1000);

            // If countdown reached zero, compute next prayer
            if (diffSec <= 0) {
                upcoming = computeNextPrayer();
                if (!upcoming) return;
                diffSec = Math.floor((upcoming.time - now) / 1000);
                setNextPrayerName(upcoming.name);
                setNextPrayerTime(upcoming.time);
                setTotalSeconds(diffSec); // reset full duration
            }

            // Format countdown
            const hours = pad(Math.floor(diffSec / 3600));
            const minutes = pad(Math.floor((diffSec % 3600) / 60));
            const seconds = pad(diffSec % 60);

            // Update state
            setPrayerCountdown({ hours, minutes, seconds });
            setRemainingSeconds(diffSec);

            // Initialize totalSeconds if null
            if (totalSeconds === null) setTotalSeconds(diffSec);
        };

        tick(); // initial call

        // Set interval to tick every second
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [prayerTimes, nextPrayerName, nextPrayerTime, totalSeconds]);

    return { nextPrayerName, nextPrayerTime, prayerCountdown, remainingSeconds, totalSeconds };
}