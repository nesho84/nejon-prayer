import { useEffect, useState, useRef } from "react";

export default function useNextPrayer(prayerTimes) {
    const [nextPrayerName, setNextPrayerName] = useState(null);
    const [nextPrayerTime, setNextPrayerTime] = useState(null);
    const [prayerCountdown, setPrayerCountdown] = useState({});
    const [remainingSeconds, setRemainingSeconds] = useState(null);
    const [totalSeconds, setTotalSeconds] = useState(null);

    // to detect when nextPrayer changes
    const prevNextTimestampRef = useRef(null);

    // ------------------------------------------------------------
    // Format time with leading zeros
    // ------------------------------------------------------------
    const pad = (num) => String(num).padStart(2, "0");

    // ------------------------------------------------------------
    // Compute next prayer based on current time
    // ------------------------------------------------------------
    const computeNextPrayer = () => {
        if (!prayerTimes) return null;

        // Find next prayer today
        const now = new Date();

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
                return { name: name, time: prayerDate };
            }
        }

        // If no more today, pick tomorrow's Fajr
        if (prayerTimes["Fajr"]) {
            const [hour, minute] = prayerTimes["Fajr"].split(":").map(Number);
            const tomorrowFajr = new Date();
            tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
            tomorrowFajr.setHours(hour, minute, 0, 0);
            return { name: "Fajr", time: tomorrowFajr };
        }

        return null;
    };

    // ------------------------------------------------------------
    // Start interval ticking every second
    // ------------------------------------------------------------
    useEffect(() => {
        // cannot proceed without prayerTimes
        if (!prayerTimes) return;

        // initial tick
        const tick = () => {
            const now = new Date();

            // compute upcoming fresh each tick (robust)
            let upcoming = computeNextPrayer();

            // cannot compute next prayer
            if (!upcoming) return;

            // If we detect a different upcoming prayer than previously stored, snapshot totalSeconds
            const upcomingTs = upcoming.time.getTime();
            if (prevNextTimestampRef.current !== upcomingTs) {
                // new prayer interval started — store it
                prevNextTimestampRef.current = upcomingTs;

                // Update next prayer info
                setNextPrayerName(upcoming.name);
                setNextPrayerTime(upcoming.time);

                // Initialize countdown
                const initialDiff = Math.max(Math.floor((upcoming.time - now) / 1000), 0);

                // Update state
                setTotalSeconds(initialDiff); // freeze the interval length for progress calculation
                setRemainingSeconds(initialDiff); // initialize remainingSeconds

                // Set initial countdown display
                const hours = pad(Math.floor(initialDiff / 3600));
                const minutes = pad(Math.floor((initialDiff % 3600) / 60));
                const seconds = pad(initialDiff % 60);
                setPrayerCountdown({ hours, minutes, seconds });
                return; // wait for next tick to continue counting down
            }

            // Normal countdown update for the current upcoming prayer
            const diffSec = Math.max(Math.floor((upcoming.time - now) / 1000), 0);

            // If diffSec reached 0, computeNextPrayer in next tick will pick the next one.
            const hours = pad(Math.floor(diffSec / 3600));
            const minutes = pad(Math.floor((diffSec % 3600) / 60));
            const seconds = pad(diffSec % 60);

            // Update state
            setPrayerCountdown({ hours, minutes, seconds });
            setRemainingSeconds(diffSec);
        };
        // run every second
        tick();

        // Set interval to tick every second
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [prayerTimes]);

    return { nextPrayerName, nextPrayerTime, prayerCountdown, remainingSeconds, totalSeconds };
}