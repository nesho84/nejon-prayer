import AppCard from "@/components/AppCard";
import { Translations } from "@/types/language.types";
import { Surah } from '@/types/quran.types';
import { ThemeColors } from "@/types/theme.types";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  surah: Surah;
  theme: ThemeColors;
  tr: Translations;
  activeSurahId: number | null;
  isPlaying: boolean;
  isBufferingActive: boolean;
  hasFinished: boolean;
  hasError: boolean;
  currentProgress: number;
  totalDuration: number;
  rowHeight: number;
  onPlayPauseReplay: (surah: Surah) => void;
  onStop: (surah: Surah) => void;
}

// Main Component (memoized for FlatList performance)
const QuranSurahRow = React.memo(({
  surah,
  theme,
  tr,
  activeSurahId,
  isPlaying,
  isBufferingActive,
  hasFinished,
  hasError,
  currentProgress,
  totalDuration,
  rowHeight,
  onPlayPauseReplay,
  onStop,
}: Props) => {

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

    if (hasError) return <MaterialCommunityIcons name="reload-alert" size={34} color={theme.danger} />;

    return (
      <Ionicons
        name={showReplay ? "reload-circle" : (isThisPlaying ? "pause-circle" : "play-circle")}
        size={34}
        color={isThisActive ? theme.accent : theme.text2}
      />
    );
  };

  return (
    <AppCard style={[styles.quranCard, { backgroundColor: theme.card, height: rowHeight }]}>
      <TouchableOpacity
        style={styles.innerContainer}
        delayPressIn={0}
        delayPressOut={0}
        activeOpacity={0.3}
        disabled={isThisBuffering}
        onPress={() => {
          router.navigate({
            pathname: "/(quran)/ayahs",
            params: {
              surahId: surah.id,
              surahName: surah.transliteration,
              readingMode: "reading",
            },
          });
        }}
      >

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
        <View style={styles.surahInfoContainer}>
          {/* Surah name row */}
          <View style={styles.surahNameRow}>
            <Text style={[styles.surahNameEnglish, { color: theme.text }]}>
              {surah.transliteration}{" "}
            </Text>
            <Text style={[styles.surahNameArabic, { color: theme.accent2 }]}>
              {surah.name}
            </Text>
          </View>

          {/* Bottom row */}
          <View style={styles.totalVersesRow}>
            <Text style={[{ fontSize: 20, lineHeight: 18, color: theme.placeholder }]}>
              {surah.type === "meccan" ? (
                <Text>🕋</Text>
              ) : (
                <Text style={{ fontSize: 18 }}>🕌</Text>
              )}{" "}
              <Text style={{ fontSize: 15, fontWeight: 'bold' }}>{surah.total_verses}{" "}</Text>
              <Text style={{ fontSize: 14 }}>{tr.labels.ayahs}</Text>
            </Text>
          </View>

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
            style={styles.playerButton}
            onPress={() => onPlayPauseReplay(surah)}
            disabled={isThisBuffering}
          >
            {playButtonIcon()}
          </TouchableOpacity>

          {/* Chevron right icon */}
          <Ionicons name="chevron-forward" size={14} color={theme.text2} style={{ opacity: 0.3, marginRight: -4 }} />
        </View>

      </TouchableOpacity>
    </AppCard>
  );
});

export default QuranSurahRow;

const styles = StyleSheet.create({
  quranCard: {
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  innerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  badgeNumber: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeNumberText: {
    fontSize: 13,
    fontWeight: "700",
  },

  surahInfoContainer: {
    flex: 1,
    flexDirection: "column",
    gap: 6,
  },
  surahNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  surahNameEnglish: {
    alignSelf: "flex-start",
    fontSize: 18,
    lineHeight: 20,
    fontWeight: "600",
  },
  surahNameArabic: {
    alignSelf: "flex-start",
    fontSize: 18,
    lineHeight: 20,
    fontWeight: "400",
  },

  totalVersesRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  progressBar: {
    height: 3,
    width: '100%',
    borderRadius: 1,
    overflow: 'hidden',
    marginTop: 12,
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