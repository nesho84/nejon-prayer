import AppCard from "@/components/AppCard";
import { Surah } from "@/services/quranService";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface QuranRowProps {
  surah: Surah;
  theme: any;
  activeSurahId: number | null;
  isPlaying: boolean;
  isBufferingActive: boolean;
  hasFinished: boolean;
  hasError: boolean;
  currentProgress: number;
  totalDuration: number;
  onPlayPauseReplay: (surah: Surah) => void;
  onStop: (surah: Surah) => void;
}

// Main Component (memoized for FlatList performance)
const QuranRow = React.memo(({
  surah,
  theme,
  activeSurahId,
  isPlaying,
  isBufferingActive,
  hasFinished,
  hasError,
  currentProgress,
  totalDuration,
  onPlayPauseReplay,
  onStop,
}: QuranRowProps) => {
  // Local state
  const isThisActive = activeSurahId === surah.id;
  const isThisPlaying = isThisActive && isPlaying;
  const isThisBuffering = isThisActive && isBufferingActive;
  const showReplay = isThisActive && hasFinished;
  const showStop = isThisActive && !isBufferingActive && !hasError;
  const widthPercent = totalDuration ? (currentProgress / totalDuration) * 100 : 0;

  // Play button icon — error takes priority over all other states
  const playButtonIcon = () => {
    if (isThisBuffering) return <ActivityIndicator size="small" color={theme.accent} />;
    if (hasError) return <Ionicons name="alert-circle" size={34} color={theme.danger} />;
    return (
      <Ionicons
        name={showReplay ? "reload-circle" : (isThisPlaying ? "pause-circle" : "play-circle")}
        size={34}
        color={isThisActive ? theme.accent : theme.text2}
      />
    );
  };

  return (
    <AppCard style={[styles.quranCard, { backgroundColor: theme.card }]}>
      <View style={styles.innerContainer}>
        {/* Left: Number badge */}
        <View style={[
          styles.badgeNumber,
          {
            backgroundColor: theme.accentLight,
            borderColor: hasError ? theme.danger : theme.accent,
            borderWidth: isThisActive ? 2 : 0
          }
        ]}
        >
          <Text style={[styles.badgeNumberText, { color: hasError ? theme.danger : theme.accent }]}>
            {surah.id}
          </Text>
        </View>

        {/* Center: Surah info */}
        <View style={styles.surahInfo}>
          <Text style={[styles.surahTitle, { color: theme.text }]}>
            {/* International name */}
            {surah.transliteration}{" "}
            <Text style={[styles.surahArabicInline, { color: theme.text2 }]}>
              {/* Arabic name */}
              ({surah.name})
            </Text>
          </Text>

          {/* First N verses preview */}
          <Text style={[styles.firstAyahPreview, { color: theme.placeholder }]} numberOfLines={2}>
            {surah.firstVerse?.text}
            {surah.firstVerse?.transliteration ? `\n${surah.firstVerse.transliteration}` : ""}
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
                name="stop-circle"
                size={34}
                color={theme.danger}
              />
            </TouchableOpacity>
          )}

          {/* Play / Pause / Replay / Error button */}
          <TouchableOpacity
            style={[styles.playerButton, { marginRight: -5 }]}
            onPress={() => onPlayPauseReplay(surah)}
            disabled={isThisBuffering}
          >
            {playButtonIcon()}
          </TouchableOpacity>
        </View>

      </View>
    </AppCard>
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