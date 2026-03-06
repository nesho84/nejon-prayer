import AppCard from "@/components/AppCard";
import { Surah } from "@/services/quranService";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface QuranRowProps {
  surah: Surah;
  theme: any;
  activeSurahNumber: number | null;
  isPlaying: boolean;
  isBufferingActive: boolean;
  hasFinished: boolean;
  currentProgress: number;
  totalDuration: number;
  onPlayPauseReplay: (surah: Surah) => void;
  onStop: (surah: Surah) => void;
}

// Main Conponent (memoized for FlatList performance)
const QuranRow = React.memo(({
  surah,
  theme,
  activeSurahNumber,
  isPlaying,
  isBufferingActive,
  hasFinished,
  currentProgress,
  totalDuration,
  onPlayPauseReplay,
  onStop,
}: QuranRowProps) => {
  // Local state
  const isThisActive = activeSurahNumber === surah.number;
  const isThisPlaying = isThisActive && isPlaying;
  const isThisBuffering = isThisActive && isBufferingActive;
  const showReplay = isThisActive && hasFinished;
  const showStop = isThisActive && !isBufferingActive;
  const widthPercent = totalDuration ? (currentProgress / totalDuration) * 100 : 0;

  return (
    <AppCard style={[styles.quranCard, { backgroundColor: theme.card }]}>
      <View style={styles.innerContainer}>
        {/* Left: Number badge */}
        <View style={[styles.badgeNumber, { backgroundColor: theme.accentLight, borderColor: theme.accent, borderWidth: isThisActive ? 2 : 0 }]}>
          <Text style={[styles.badgeNumberText, { color: theme.accent }]}>
            {surah.number}
          </Text>
        </View>

        {/* Center: Surah info */}
        <View style={styles.surahInfo}>
          <Text style={[styles.surahTitle, { color: theme.text }]}>
            {surah.englishName}{" "}

            <Text style={[styles.surahArabicInline, { color: theme.text2 }]}>
              ({surah.name})
            </Text>
          </Text>

          <Text style={[styles.firstAyahPreview, { color: theme.placeholder }]} numberOfLines={1}>
            {surah.firstAyah}
          </Text>

          {/* Progress bar */}
          {isThisActive && totalDuration > 0 && (
            <View style={[styles.progressBar, { backgroundColor: theme.divider }]}>
              <View style={[styles.progressFill, { width: `${widthPercent}%`, backgroundColor: theme.accent }]} />
            </View>
          )}
        </View>

        {/* Right: player buttons */}
        <View style={styles.playerButtonsContainer}>
          {/* Stop button */}
          {showStop && (
            <TouchableOpacity
              style={styles.playerButton}
              onPress={() => onStop(surah)}
              disabled={isThisBuffering}
            >
              <Ionicons
                name={"stop-circle"}
                size={34}
                color={isThisActive ? theme.danger : theme.text2}
              />
            </TouchableOpacity>
          )}

          {/* Play/Pause/Replay buttons */}
          <TouchableOpacity
            style={[styles.playerButton, { marginRight: -5 }]}
            onPress={() => onPlayPauseReplay(surah)}
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

      </View>
    </AppCard >
  );
});

export default QuranRow;

const styles = StyleSheet.create({
  quranCard: {
    padding: 12,
  },
  innerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  badgeNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeNumberText: {
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
  playerButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  playerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});