import AppCard from "@/components/AppCard";
import { Surah } from "@/services/quranService";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface QuranRowProps {
  item: Surah;
  theme: any;
  activeSound: number | null;
  isPlaying: boolean;
  isBuffering: boolean;
  hasFinished: boolean;
  currentProgress: number;
  totalDuration: number;
  onPlayPause: (num: number) => void;
}

// Main Conponent (memoized for FlatList performance)
const QuranRow = React.memo(({
  item,
  theme,
  activeSound,
  isPlaying,
  isBuffering,
  hasFinished,
  currentProgress,
  totalDuration,
  onPlayPause
}: QuranRowProps) => {
  // Button and progress bar states
  const isThisActive = activeSound === item.number;
  const isThisPlaying = isThisActive && isPlaying;
  const isThisBuffering = isThisActive && isBuffering;
  const showReplay = isThisActive && hasFinished;
  const widthPercent = totalDuration ? (currentProgress / totalDuration) * 100 : 0;

  return (
    <AppCard style={[styles.quranCard, { backgroundColor: theme.card }]}>
      <View style={styles.quranRow}>
        {/* Left: Number badge */}
        <View style={[styles.numberBadge, { backgroundColor: theme.accentLight, borderColor: theme.accent, borderWidth: isThisActive ? 2 : 1 }]}>
          <Text style={[styles.numberText, { color: theme.accent }]}>
            {item.number}
          </Text>
        </View>

        {/* Center: Surah info */}
        <View style={styles.surahInfo}>
          <Text style={[styles.surahTitle, { color: theme.text }]}>
            {item.englishName}{" "}

            <Text style={[styles.surahArabicInline, { color: theme.text2 }]}>
              ({item.name})
            </Text>
          </Text>

          <Text style={[styles.firstAyahPreview, { color: theme.placeholder }]} numberOfLines={1}>
            {item.firstAyah}
          </Text>

          {/* Progress bar */}
          {isThisActive && totalDuration > 0 && (
            <View style={[styles.progressBar, { backgroundColor: theme.divider }]}>
              <View style={[styles.progressFill, { width: `${widthPercent}%`, backgroundColor: theme.accent }]} />
            </View>
          )}
        </View>

        {/* Right: Play/Stop/Replay button */}
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => onPlayPause(item.number)}
          disabled={isThisBuffering}
        >
          {isThisBuffering ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : (
            <Ionicons
              name={showReplay ? "reload-circle" : (isThisPlaying ? "pause-circle" : "play-circle")}
              size={34}
              color={isThisActive ? theme.accent : theme.text2}
            />
          )}
        </TouchableOpacity>
      </View>
    </AppCard>
  );
});

export default QuranRow;

const styles = StyleSheet.create({
  quranCard: {
    padding: 12,
  },
  quranRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  numberBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  numberText: {
    fontSize: 13,
    fontWeight: "700",
  },
  surahInfo: {
    flex: 1,
    gap: 4,
  },
  surahTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  surahArabicInline: {
    fontSize: 14,
    fontWeight: "400",
  },
  firstAyahPreview: {
    fontSize: 13,
    textAlign: "right",
    writingDirection: "rtl",
    lineHeight: 20,
  },
  progressBar: {
    height: 3,
    width: '100%',
    borderRadius: 1,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
  },
  playButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});