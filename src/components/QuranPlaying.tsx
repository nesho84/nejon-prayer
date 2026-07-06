import { useDebugStore } from "@/debug/debugStore";
import { useQuranAudioStore } from "@/store/quranAudioStore";
import { useThemeStore } from "@/store/themeStore";
import { Ionicons } from "@react-native-vector-icons/ionicons/static";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

const BAR_HEIGHTS = [10, 16, 22, 16, 10]; // base heights for natural shape
const DURATIONS = [600, 900, 700, 800, 650]; // staggered speeds

// Animated waveform Internal component
function WaveformBars({ color, isActive, isPlaying }: { color: string; isActive: boolean, isPlaying: boolean }) {
  // Created once (lazy init) so it can be safely read during render — not a ref
  const [anims] = useState(() => BAR_HEIGHTS.map(() => new Animated.Value(0)));
  const animRefs = useRef<Animated.CompositeAnimation[]>([]);
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!isActive) {
      timeoutIdsRef.current.forEach(clearTimeout);
      animRefs.current.forEach((a) => a.stop());
      return;
    }

    if (isPlaying) {
      animRefs.current = anims.map((anim, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: 1, duration: DURATIONS[i], useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0, duration: DURATIONS[i], useNativeDriver: true }),
          ])
        )
      );
      timeoutIdsRef.current = animRefs.current.map((anim, i) =>
        setTimeout(() => anim.start(), i * 120)
      );
    } else {
      timeoutIdsRef.current.forEach(clearTimeout);
      animRefs.current.forEach((a) => a.stop());
      // Animate bars down to a static "paused" state
      anims.forEach((anim) =>
        Animated.timing(anim, { toValue: 0.15, duration: 300, useNativeDriver: true }).start()
      );
    }

    return () => {
      timeoutIdsRef.current.forEach(clearTimeout);
      animRefs.current.forEach((a) => a.stop());
    };
  }, [isActive, isPlaying, anims]);

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
const QuranPlaying = React.memo(() => {
  // Stores
  const theme = useThemeStore((state) => state.theme);

  // Quran Store
  const isActive = useQuranAudioStore((state) => state.isActive);
  const isPlaying = useQuranAudioStore((state) => state.isPlaying);
  const activeSurahName = useQuranAudioStore((state) => state.activeSurahName);

  // DEBUG: force-show the now-playing card for UI testing (Debug Panel toggle)
  const forceQuranPlaying = useDebugStore((state) => state.forceQuranPlaying);

  if (!forceQuranPlaying && (!isActive || activeSurahName === null)) return null;

  return (
    <Pressable onPress={() => router.navigate("/(tabs)/quran-tab")}>
      {({ pressed }) => (

        <View style={[
          styles.container,
          {
            backgroundColor: theme.card,
            borderColor: theme.divider,
            opacity: pressed ? 0.7 : 1,
          }
        ]}>
          {/* Left */}
          <View style={styles.leftContainer}>
            <Ionicons
              name={isPlaying ? "play-circle" : "pause-circle"}
              size={18}
              color={isPlaying ? theme.accent : theme.accent2}
            />
            <Text style={[styles.surahText, { color: isPlaying ? theme.accent : theme.accent2 }]} numberOfLines={1}>
              {activeSurahName ?? "Quran is playing..."}
            </Text>
          </View>

          {/* Center */}
          <View style={styles.waveformContainer}>
            <WaveformBars color={isPlaying ? theme.accent : theme.accent2} isActive={isActive} isPlaying={isPlaying} />
          </View>

          {/* Right */}
          <View style={styles.rightContainer}>
            <Ionicons
              name="chevron-forward-outline"
              size={18}
              color={isPlaying ? theme.accent : theme.accent2}
            />
          </View>
        </View>

      )}
    </Pressable>
  );
});

QuranPlaying.displayName = 'QuranPlaying';

export default QuranPlaying;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 20,
    // Card Shadow
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
    lineHeight: 16,
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
