import { View, Text, StyleSheet, Vibration } from "react-native";
import { useEffect, useRef } from "react";
import Svg, { Circle } from "react-native-svg";

interface Props {
    currentCount: number;
    totalCount: number;
    onCountReached: () => void;
    size?: number;
    strokeWidth?: number;
    strokeColor?: string;
    color?: string;
    textColor?: string;
    vibrationDuration?: number;
}

export default function CounterCircle({
    currentCount = 0,
    totalCount = 33,
    onCountReached,
    size = 140,
    strokeWidth = 10,
    strokeColor = "#eee",
    color = "#2563eb",
    textColor = '#333',
    vibrationDuration = 500,
}: Props) {
    // Refs
    const previousCountRef = useRef<number>(currentCount);

    // ------------------------------------------------------------
    // Handle vibration and count reset when totalCount is reached
    // ------------------------------------------------------------
    useEffect(() => {
        // Check if count just reached totalCount
        if (currentCount === totalCount && previousCountRef.current !== totalCount && totalCount > 0) {
            Vibration.vibrate(vibrationDuration);
            // Notify parent to reset count
            if (onCountReached) {
                onCountReached();
            }
        }
        previousCountRef.current = currentCount;
    }, [currentCount, totalCount, vibrationDuration, onCountReached]);

    // Don't render if totalCount is 0 to avoid division by zero
    if (!totalCount) return null;

    // Calculate circle parameters
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    // Progress goes from 0 → 1 as count increases
    const progress = currentCount / totalCount;
    const strokeDashoffset = circumference * (1 - progress);

    return (
        <View style={[styles.innerContainer, { width: size, height: size }]}>
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

            {/* Counter Text */}
            <View style={styles.innerSection}>
                <Text style={[styles.counterText, { color: textColor }]}>
                    <Text style={[styles.currentCount, { color: color }]}>
                        {currentCount}
                    </Text>
                    /{totalCount}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    innerContainer: {
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
        width: 260,
        borderRadius: 130,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    innerSection: {
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