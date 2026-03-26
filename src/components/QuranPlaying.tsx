import { useQuranStore } from "@/store/quranStore";
import { useThemeStore } from "@/store/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

const BAR_HEIGHTS = [10, 16, 22, 16, 10]; // base heights for natural shape
const DURATIONS = [600, 900, 700, 800, 650]; // staggered speeds

// Animated waveform Internal component
function WaveformBars({ color, isActive, isPlaying }: { color: string; isActive: boolean, isPlaying: boolean }) {
  const anims = useRef(BAR_HEIGHTS.map(() => new Animated.Value(0))).current;
  const animRefs = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    if (!isActive) return;

    if (isPlaying) {
      animRefs.current = anims.map((anim, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: 1, duration: DURATIONS[i], useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0, duration: DURATIONS[i], useNativeDriver: true }),
          ])
        )
      );
      animRefs.current.forEach((anim, i) => setTimeout(() => anim.start(), i * 120));
    } else {
      animRefs.current.forEach((a) => a.stop());
      // Animate bars down to a static "paused" state
      anims.forEach((anim) =>
        Animated.timing(anim, { toValue: 0.15, duration: 300, useNativeDriver: true }).start()
      );
    }

    return () => animRefs.current.forEach((a) => a.stop());
  }, [isPlaying]);

  return (
    <View style={styles.waveform}>
      {anims.map((anim, i) => {
        const scaleY = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.3, 1],
        });
        return (
          <Animated.View
            key={i}
            style={[
              styles.waveformBar,
              {
                backgroundColor: color,
                height: BAR_HEIGHTS[i],
                transform: [{ scaleY }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

// Main component
export default function QuranPlaying() {
  const router = useRouter();

  // Stores
  const theme = useThemeStore((s) => s.theme);

  // Quran Store
  const isActive = useQuranStore((s) => s.isActive);
  const isPlaying = useQuranStore((s) => s.isPlaying);
  const activeSurahName = useQuranStore((s) => s.activeSurahName);

  if (!isActive || activeSurahName === null) return null;

  return (
    <Pressable onPress={() => router.navigate("/(quran)/surahs")}>
      {({ pressed }) => (

        <View style={[
          styles.container,
          {
            opacity: pressed ? 0.7 : 1,
            backgroundColor: theme.card,
            borderColor: theme.divider
          }
        ]}
        >
          {/* Left */}
          <View style={styles.leftContainer}>
            <Ionicons name="play-circle" size={18} color={theme.accent} />
            <Text style={[styles.surahText, { color: theme.accent }]} numberOfLines={1}>
              {activeSurahName ?? "Quran is playing..."}
            </Text>
          </View>

          {/* Center */}
          <View style={styles.waveformContainer}>
            <WaveformBars color={theme.accent} isActive={isActive} isPlaying={isPlaying} />
          </View>

          {/* Right */}
          <View style={styles.rightContainer}>
            <Ionicons name="chevron-forward-outline" size={18} color={theme.accent} />
          </View>
        </View>

      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  // Left side with icon and text
  leftContainer: {
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  surahText: {
    fontSize: 14,
    fontWeight: "500",
    flexShrink: 1,
  },

  // Center waveform
  waveformContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  waveform: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    height: 24,
  },
  waveformBar: {
    width: 3,
    borderRadius: 2,
  },

  // Right side with chevron
  rightContainer: {
    alignItems: "flex-end",
  },
});