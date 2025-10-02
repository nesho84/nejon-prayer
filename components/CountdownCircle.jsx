import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";

export default function CountdownCircle({
    nextPrayerName,
    prayerCountdown,
    remainingSeconds,
    totalSeconds,
    theme,
    tr,
    size = 140,
    strokeWidth = 10,
    backgroundColor = "#eee",
    color = "#2563eb",
}) {
    if (!totalSeconds || remainingSeconds === null) return null;

    const radius = (size - strokeWidth) / 2; // Radius of the circle
    const circumference = 2 * Math.PI * radius; // Circle perimeter

    // progress goes from 0 → 1 as time passes
    const progress = 1 - (remainingSeconds / totalSeconds);
    const strokeDashoffset = circumference * (1 - progress);

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg width={size} height={size}>
                {/* Background Circle */}
                <Circle
                    stroke={backgroundColor}
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
                    rotation="-90"
                    originX={size / 2}
                    originY={size / 2}
                    fill="transparent"
                />
            </Svg>

            {/* Countdown Text */}
            <View style={styles.innerContainer}>
                <Text style={[styles.prayerName, { color: theme.text }]}>
                    » {tr(`prayers.${nextPrayerName}`)} «
                </Text>
                <Text style={[styles.prayerTime, { color: theme.accent }]}>
                    {prayerCountdown.hours}<Text style={styles.hms}>h </Text>
                    {prayerCountdown.minutes}<Text style={styles.hms}>m </Text>
                    {prayerCountdown.seconds}<Text style={styles.hms}>s</Text>
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    innerContainer: {
        position: "absolute",
        justifyContent: "center",
        alignItems: "center",
    },
    prayerName: {
        fontSize: 22,
        marginBottom: 3,
    },
    prayerTime: {
        fontSize: 24,
    },
    hms: {
        fontSize: 14,
    },
});
