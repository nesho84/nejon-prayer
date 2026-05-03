import { PrayerCountdown, PrayerName, PrayerTimes } from '@/types/prayer.types';
import { useIsFocused } from '@react-navigation/native';
import { useEffect, useRef, useState } from "react";
import { AppState } from 'react-native';

interface NextPrayerType {
    nextPrayerName: PrayerName | null;
    nextPrayerTime: Date | null;
    prayerCountdown: PrayerCountdown | null;
    remainingSeconds: number | null;
    totalSeconds: number;
}

const PRAYER_ORDER: PrayerName[] = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

// ------------------------------------------------------------
// Find the next upcoming prayer and the previous one that just passed.
// Exported so callers can compute nextPrayerName without a per-second hook.
// ------------------------------------------------------------
export function computeNextPrayer(prayerTimes: PrayerTimes | null): { name: PrayerName; time: Date; previousTime: Date | null } | null {
    if (!prayerTimes) return null;

    const now = new Date();
    let previousPrayer: Date | null = null;

    for (const name of PRAYER_ORDER) {
        const timeStr = prayerTimes[name];
        if (!timeStr) continue;

        const [hour, minute] = timeStr.split(":").map(Number);
        const prayerDate = new Date();
        prayerDate.setHours(hour, minute, 0, 0);

        if (prayerDate > now) {
            return { name, time: prayerDate, previousTime: previousPrayer };
        }

        previousPrayer = prayerDate;
    }

    // No more prayers today — use tomorrow's Fajr
    if (prayerTimes.Fajr) {
        const [hour, minute] = prayerTimes.Fajr.split(":").map(Number);
        const tomorrowFajr = new Date();
        tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
        tomorrowFajr.setHours(hour, minute, 0, 0);
        return { name: "Fajr", time: tomorrowFajr, previousTime: previousPrayer };
    }

    return null;
}

export default function useNextPrayer(prayerTimes: PrayerTimes | null): NextPrayerType {
    const isFocused = useIsFocused();
    const [nextPrayerName, setNextPrayerName] = useState<PrayerName | null>(null);
    const [nextPrayerTime, setNextPrayerTime] = useState<Date | null>(null);
    const [prayerCountdown, setPrayerCountdown] = useState<PrayerCountdown | null>(null);
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
    const [totalSeconds, setTotalSeconds] = useState<number>(0);

    // Track previous prayer timestamp to detect when interval changes
    const prevNextTimestampRef = useRef<number | null>(null);

    // ------------------------------------------------------------
    // Format numbers with leading zeros (e.g., 5 -> "05")
    // ------------------------------------------------------------
    const pad = (num: number): string => String(num).padStart(2, "0");

    // ------------------------------------------------------------
    // Convert total seconds into padded { hours, minutes, seconds }
    // ------------------------------------------------------------
    const formatCountdown = (totalSec: number) => ({
        hours: pad(Math.floor(totalSec / 3600)),
        minutes: pad(Math.floor((totalSec % 3600) / 60)),
        seconds: pad(totalSec % 60),
    });

    // ------------------------------------------------------------
    // Update countdown every second
    // ------------------------------------------------------------
    useEffect(() => {
        if (!prayerTimes || !isFocused) return;

        const tick = () => {
            if (AppState.currentState !== 'active') return;

            const now = new Date();
            let upcoming = computeNextPrayer(prayerTimes);

            if (!upcoming) return;

            const upcomingTs = upcoming.time.getTime();

            // Detect when we've moved to a new prayer interval
            if (prevNextTimestampRef.current !== upcomingTs) {
                prevNextTimestampRef.current = upcomingTs;

                setNextPrayerName(upcoming.name);
                setNextPrayerTime(upcoming.time);

                // Calculate remaining time until next prayer
                const remainingTime = Math.max(Math.floor((upcoming.time.getTime() - now.getTime()) / 1000), 0);

                // Calculate full interval between prayers for progress circle
                const fullInterval = upcoming.previousTime
                    ? Math.floor((upcoming.time.getTime() - upcoming.previousTime.getTime()) / 1000)
                    : remainingTime;

                setTotalSeconds(fullInterval); // freeze the interval length for progress calculation
                setRemainingSeconds(remainingTime); // initialize remainingSeconds

                // Format countdown display
                setPrayerCountdown(formatCountdown(remainingTime));

                return;
            }

            // Update countdown for current interval
            const diffSec = Math.max(Math.floor((upcoming.time.getTime() - now.getTime()) / 1000), 0);
            setPrayerCountdown(formatCountdown(diffSec));
            setRemainingSeconds(diffSec);
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [prayerTimes, isFocused]);

    return { nextPrayerName, nextPrayerTime, prayerCountdown, remainingSeconds, totalSeconds };
}