import { ALL_PRAYERS, MAIN_PRAYERS, PrayerCountdown, PrayerEntry, PrayerName, PrayerTimes } from '@/types/prayer.types';
import { isTimePast } from '@/utils/datetime';
import { useIsFocused } from 'expo-router';
import { useEffect, useRef, useState } from "react";
import { AppState } from 'react-native';

interface NextPrayerType {
    prevPrayer: PrayerEntry | null;
    currentPrayerName: PrayerName | null;
    nextPrayerName: PrayerName | null;
    afterNextPrayer: PrayerEntry | null;
    prayerCountdown: PrayerCountdown | null;
    remainingSeconds: number | null;
    totalSeconds: number;
}

// ------------------------------------------------------------
// Find the next upcoming prayer and the previous one that just passed.
// ------------------------------------------------------------
function getNextPrayer(prayerTimes: PrayerTimes | null): { name: PrayerName; time: Date; previousTime: Date | null } | null {
    if (!prayerTimes) return null;

    const now = new Date();
    let previousPrayer: Date | null = null;

    for (const name of MAIN_PRAYERS) {
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

// ------------------------------------------------------------
// Current prayer period — the prayer whose window is currently active.
// Returns the prayer just before nextPrayerName in MAIN_PRAYERS, or null
// if next is Fajr (nothing has started yet today).
// ------------------------------------------------------------
function getCurrentPrayer(prayerTimes: PrayerTimes, nextPrayerName: PrayerName, nextPrayerTime: Date): PrayerEntry | null {
    const idx = MAIN_PRAYERS.indexOf(nextPrayerName);

    // Not a main prayer (Imsak, Sunrise)
    if (idx < 0) return null;

    // idx === 0 means next prayer is Fajr.
    // If Fajr is tomorrow → we're in the post-Isha overnight window → highlight Isha.
    // If Fajr is today    → we're before Fajr (e.g. 02:00) → nothing highlighted.
    if (idx === 0) {
        const isTomorrow = nextPrayerTime.getDate() !== new Date().getDate();
        return isTomorrow ? { name: "Isha", time: prayerTimes.Isha } : null;
    }
    // Fajr window closes at Sunrise
    if (idx === 1 && isTimePast(prayerTimes.Sunrise)) {
        return null;
    }
    // Default → prayer just before next is current
    const name = MAIN_PRAYERS[idx - 1];
    const time = prayerTimes[name];

    return time ? { name, time } : null;
}

// ------------------------------------------------------------
// Previous prayer — the one that just passed in ALL_PRAYERS.
// Used only for the countdown card left side-column display.
// ------------------------------------------------------------
function getPrevPrayer(prayerTimes: PrayerTimes, nextPrayerName: PrayerName): PrayerEntry | null {
    const idx = ALL_PRAYERS.indexOf(nextPrayerName);
    if (idx === -1) return null;
    const prevName = idx === 0 ? ALL_PRAYERS[ALL_PRAYERS.length - 1] : ALL_PRAYERS[idx - 1];
    const prevTime = prayerTimes[prevName];
    if (!prevTime) return null;

    return { name: prevName, time: prevTime };
}

// ------------------------------------------------------------
// Prayer after next — the one coming after nextPrayerName in ALL_PRAYERS.
// Used only for the countdown card right side-column display.
// ------------------------------------------------------------
function getAfterNextPrayer(prayerTimes: PrayerTimes, nextPrayerName: PrayerName): PrayerEntry | null {
    const idx = ALL_PRAYERS.indexOf(nextPrayerName);
    if (idx === -1) return null;
    const afterName = ALL_PRAYERS[(idx + 1) % ALL_PRAYERS.length];
    const afterTime = prayerTimes[afterName];
    if (!afterTime) return null;

    return { name: afterName, time: afterTime };
}

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

export default function useNextPrayer(prayerTimes: PrayerTimes | null): NextPrayerType {
    const isFocused = useIsFocused();

    // State — all values that drive UI updates
    const [currentPrayerName, setCurrentPrayerName] = useState<PrayerName | null>(null);
    const [nextPrayerName, setNextPrayerName] = useState<PrayerName | null>(null);
    const [prayerCountdown, setPrayerCountdown] = useState<PrayerCountdown | null>(null);
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
    const [totalSeconds, setTotalSeconds] = useState<number>(0);

    // Track previous prayer timestamp to detect when interval changes
    const prevNextTimestampRef = useRef<number | null>(null);

    // ------------------------------------------------------------
    // Derived values — recompute every render from current nextPrayerName.
    // Safe as derived because they only depend on nextPrayerName, not real time.
    // ------------------------------------------------------------
    const prevPrayer = prayerTimes && nextPrayerName ? getPrevPrayer(prayerTimes, nextPrayerName) : null;
    const afterNextPrayer = prayerTimes && nextPrayerName ? getAfterNextPrayer(prayerTimes, nextPrayerName) : null;

    // ------------------------------------------------------------
    // Tick every second — drives countdown and detects prayer transitions
    // ------------------------------------------------------------
    useEffect(() => {
        if (!prayerTimes || !isFocused) return;

        const tick = () => {
            if (AppState.currentState !== 'active') return;

            const now = new Date();
            const upcoming = getNextPrayer(prayerTimes);
            if (!upcoming) return;

            const upcomingTs = upcoming.time.getTime();

            // Update currentPrayer every second — needed for Sunrise transition
            // where nextPrayerName stays Dhuhr but Fajr highlight must drop
            const current = getCurrentPrayer(prayerTimes, upcoming.name, upcoming.time);
            setCurrentPrayerName(current?.name ?? null);

            // Detect when we've moved to a new prayer interval
            if (prevNextTimestampRef.current !== upcomingTs) {
                prevNextTimestampRef.current = upcomingTs;

                setNextPrayerName(upcoming.name);

                // Calculate remaining time until next prayer
                const remainingTime = Math.max(Math.floor((upcoming.time.getTime() - now.getTime()) / 1000), 0);

                // Calculate full interval between prayers for progress circle
                const fullInterval = upcoming.previousTime
                    ? Math.floor((upcoming.time.getTime() - upcoming.previousTime.getTime()) / 1000)
                    : remainingTime;

                setTotalSeconds(fullInterval); // freeze the interval length for progress calculation
                setRemainingSeconds(remainingTime); // initialize remainingSeconds
                setPrayerCountdown(formatCountdown(remainingTime)); // Format countdown display

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

    return {
        prevPrayer,
        currentPrayerName,
        nextPrayerName,
        afterNextPrayer,
        prayerCountdown,
        remainingSeconds,
        totalSeconds,
    };
}
