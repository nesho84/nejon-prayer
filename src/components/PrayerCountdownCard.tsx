import useNextPrayer from "@/hooks/useNextPrayer";
import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { PrayerName, PrayerTimes } from "@/types/prayer.types";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import PrayerIcon from "./PrayerIcon";

interface Props {
  prayerTimes: PrayerTimes | null;
  onNextPrayerChange?: (name: PrayerName) => void;
  onCurrentPrayerChange?: (name: PrayerName | null) => void;
  size?: number;
  strokeWidth?: number;
  strokeColor?: string;
  color?: string;
}

const PrayerCountdownCard = React.memo(({
  prayerTimes,
  onNextPrayerChange,
  onCurrentPrayerChange,
  size = 140,
  strokeWidth = 10,
  strokeColor = "#eee",
  color = "#2563eb",
}: Props) => {

  // Stores
  const theme = useThemeStore((state) => state.theme);
  const tr = useLanguageStore((state) => state.tr);

  // Countdown state (ticks every second, isolated from HomeScreen)
  const { nextPrayerName, prayerCountdown, remainingSeconds, totalSeconds, currentPrayer, prevPrayer, afterNextPrayer } = useNextPrayer(prayerTimes);

  // Notify parent when the next prayer changes (at most 5x per day)
  useEffect(() => {
    if (nextPrayerName) onNextPrayerChange?.(nextPrayerName);
  }, [nextPrayerName, onNextPrayerChange]);

  // Notify parent when the current prayer period changes
  useEffect(() => {
    onCurrentPrayerChange?.(currentPrayer?.name ?? null);
  }, [currentPrayer?.name, onCurrentPrayerChange]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Don't render if no totalSeconds, remainingSeconds, or prayerCountdown is null
  if (!nextPrayerName || !prayerCountdown || !totalSeconds || remainingSeconds === null) return null;

  // progress goes from 0 → 1 as time passes
  const progress = 1 - (remainingSeconds / totalSeconds);
  const strokeDashoffset = circumference * (1 - progress);

  // Main Content
  return (
    <View style={styles.row}>

      {/* LEFT: Previous prayer */}
      <View style={styles.sideColumn}>
        {prevPrayer && (
          <>
            <PrayerIcon name={prevPrayer.name} size={21} color={theme.accent} opacity={0.5} style={{ marginBottom: 2 }} />
            <Text style={[styles.sidePrayerLabel, { color: theme.text2 }]} numberOfLines={1}>
              {tr.prayers[prevPrayer.name] || prevPrayer.name}
            </Text>
            <Text style={[styles.sidePrayerTime, { color: theme.text2 }]}>
              {prevPrayer.time}
            </Text>
          </>
        )}
      </View>

      {/* CENTER: Progress circle */}
      <View style={[styles.circleWrapper, { width: size, height: size }]}>
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

        {/* Prayer icon floating at top of circle interior — independent of centered text */}
        <View style={{ position: 'absolute', top: strokeWidth + 15, alignSelf: 'center' }}>
          <PrayerIcon name={nextPrayerName} size={21} color={theme.accent} opacity={0.65} />
        </View>

        {/* Countdown Text — centered */}
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

      {/* RIGHT: After-next prayer */}
      <View style={styles.sideColumn}>
        {afterNextPrayer && (
          <>
            <PrayerIcon name={afterNextPrayer.name} size={21} color={theme.accent} opacity={0.5} style={{ marginBottom: 2 }} />
            <Text style={[styles.sidePrayerLabel, { color: theme.text2 }]} numberOfLines={1}>
              {tr.prayers[afterNextPrayer.name] || afterNextPrayer.name}
            </Text>
            <Text style={[styles.sidePrayerTime, { color: theme.text2 }]}>
              {afterNextPrayer.time}
            </Text>
          </>
        )}
      </View>

    </View>
  );
});

export default PrayerCountdownCard;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  circleWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  innerContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  prayerName: {
    fontSize: 18,
    marginBottom: 2,
  },
  prayerTime: {
    fontSize: 25,
    fontWeight: "400",
  },
  hms: {
    fontSize: 13,
  },

  sideColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  sidePrayerLabel: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    opacity: 0.7,
  },
  sidePrayerTime: {
    fontSize: 21,
    fontWeight: "400",
    opacity: 0.4,
  },
});
