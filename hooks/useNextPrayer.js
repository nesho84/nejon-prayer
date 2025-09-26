import { useEffect, useState } from "react";

export default function useNextPrayer(prayerTimes) {
    const [nextPrayerName, setNextPrayerName] = useState(null);
    const [nextPrayerTime, setNextPrayerTime] = useState(null);
    const [prayerCountdown, setPrayerCountdown] = useState("");

    // Determine next prayer and countdown
    const updateNextPrayer = () => {
        if (!prayerTimes) return;

        const now = new Date();
        let upcoming = null;

        Object.entries(prayerTimes).forEach(([name, time]) => {
            const [hour, minute] = time.split(":").map(Number);
            const prayerDate = new Date();
            prayerDate.setHours(hour, minute, 0, 0);

            if (prayerDate > now && !upcoming) {
                upcoming = { name, time: prayerDate };
            }
        });

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

        const diff = upcoming.time - now;
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        setPrayerCountdown(`${hours}h ${minutes}m ${seconds}s`);
    };

    // Start interval ticking every second
    useEffect(() => {
        if (!prayerTimes) return;

        updateNextPrayer(); // initial tick

        const interval = setInterval(updateNextPrayer, 1000);

        return () => clearInterval(interval);
    }, [prayerTimes]);

    return { nextPrayerName, nextPrayerTime, prayerCountdown };
}