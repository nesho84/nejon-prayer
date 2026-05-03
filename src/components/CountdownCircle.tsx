import useNextPrayer from "@/hooks/useNextPrayer";
import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { PrayerName, PrayerTimes } from "@/types/prayer.types";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

interface Props {
    prayerTimes: PrayerTimes | null;
    onNextPrayerChange?: (name: PrayerName) => void;
    size?: number;
    strokeWidth?: number;
    strokeColor?: string;
    color?: string;
}

const CountdownCircle = React.memo(({
    prayerTimes,
    onNextPrayerChange,
    size = 140,
    strokeWidth = 10,
    strokeColor = "#eee",
    color = "#2563eb",
}: Props) => {

    // Stores
    const theme = useThemeStore((state) => state.theme);
    const tr = useLanguageStore((state) => state.tr);

    // Countdown state (ticks every second, isolated from HomeScreen)
    const { nextPrayerName, prayerCountdown, remainingSeconds, totalSeconds } = useNextPrayer(prayerTimes);

    // Notify parent when the next prayer changes (at most 5x per day)
    useEffect(() => {
        if (nextPrayerName) onNextPrayerChange?.(nextPrayerName);
    }, [nextPrayerName, onNextPrayerChange]);

    const radius = (size - strokeWidth) / 2; // Radius of the circle
    const circumference = 2 * Math.PI * radius; // Circle perimeter

    // Don't render if no totalSeconds, remainingSeconds, or prayerCountdown is null
    if (!nextPrayerName || !prayerCountdown || !totalSeconds || remainingSeconds === null) return null;

    // progress goes from 0 → 1 as time passes
    const progress = 1 - (remainingSeconds / totalSeconds);
    const strokeDashoffset = circumference * (1 - progress);

    // Main Content
    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg width={size} height={size}>
                {/* Background Circle */}
                <Circle
                    stroke={strokeColor}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
                {/* Progress Circle */}
                <Circle
                    stroke={color}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    fill="transparent"
                />
            </Svg>

            {/* Countdown Text */}
            <View style={styles.innerContainer}>
                <Text style={[styles.prayerName, { color: theme.text }]}>
                    » {tr.prayers[nextPrayerName]} «
                </Text>
                <Text style={[styles.prayerTime, { color: theme.accent }]}>
                    {prayerCountdown.hours}<Text style={styles.hms}>h </Text>
                    {prayerCountdown.minutes}<Text style={styles.hms}>m </Text>
                    {prayerCountdown.seconds}<Text style={styles.hms}>s</Text>
                </Text>
            </View>
        </View>
    );
});

export default CountdownCircle;

const styles = StyleSheet.create({
    container: {
        alignSelf: "center",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    innerContainer: {
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
    },
    prayerName: {
        fontSize: 18,
        marginBottom: 3,
    },
    prayerTime: {
        fontSize: 24,
    },
    hms: {
        fontSize: 14,
    },
});
