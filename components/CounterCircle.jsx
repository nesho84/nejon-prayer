import { View, Text, StyleSheet, Vibration } from "react-native";
import { useEffect, useRef } from "react";
import Svg, { Circle } from "react-native-svg";

export default function CounterCircle({
    currentCount = 0,
    totalCount = 33,
    onCountReached,
    theme,
    tr,
    size = 140,
    strokeWidth = 10,
    backgroundColor = "#eee",
    color = "#2563eb",
    vibrationDuration = 500,
}) {
    const previousCount = useRef(currentCount);

    useEffect(() => {
        // Check if count just reached totalCount
        if (currentCount === totalCount && previousCount.current !== totalCount && totalCount > 0) {
            Vibration.vibrate(vibrationDuration);
            // Notify parent to reset count
            if (onCountReached) {
                onCountReached();
            }
        }
        previousCount.current = currentCount;
    }, [currentCount, totalCount, vibrationDuration, onCountReached]);

    if (!totalCount) return null;

    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    // Progress goes from 0 → 1 as count increases
    const progress = currentCount / totalCount;
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
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    fill="transparent"
                />
            </Svg>

            {/* Counter Text */}
            <View style={styles.innerContainer}>
                <Text style={[styles.counterText, { color: theme.text2 }]}>
                    <Text style={[styles.currentCount, { color: theme.accent }]}>
                        {currentCount}
                    </Text>
                    /{totalCount}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
    },
    innerContainer: {
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
    },
    counterText: {
        fontSize: 48,
        fontWeight: "300",
    },
    currentCount: {
        fontWeight: "400",
    },
});