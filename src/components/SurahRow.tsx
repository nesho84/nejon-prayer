import AppCard from "@/components/AppCard";
import { Surah } from "@/services/quranService";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface SurahRowProps {
  item: Surah;
  activeSurah: number | null;
  isPlaying: boolean;
  isBuffering: boolean;
  theme: any;
  onPlayPause: (num: number) => void;
}

const SurahRow = React.memo(({
  item,
  activeSurah,
  isPlaying,
  isBuffering,
  theme,
  onPlayPause
}: SurahRowProps) => {
  const isActive = activeSurah === item.number;
  const isThisPlaying = isActive && isPlaying;
  const isThisBuffering = isActive && isBuffering;

  return (
    <AppCard style={[styles.surahCard, { backgroundColor: theme.card }]}>
      <View style={styles.surahRow}>
        {/* Left: Number badge */}
        <View style={[styles.numberBadge, { backgroundColor: theme.accentLight, borderColor: theme.accent, borderWidth: isActive ? 2 : 1 }]}>
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
          <Text
            style={[styles.firstAyahPreview, { color: theme.placeholder }]}
            numberOfLines={1}
          >
            {item.firstAyah}
          </Text>
        </View>

        {/* Right: Play/Stop button */}
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => onPlayPause(item.number)}
          disabled={isThisBuffering}
        >
          {isThisBuffering ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : (
            <Ionicons
              name={isThisPlaying ? "stop-circle" : "play-circle"}
              size={34}
              color={isActive ? theme.accent : theme.text2}
            />
          )}
        </TouchableOpacity>
      </View>
    </AppCard>
  );
});

export default SurahRow;

const styles = StyleSheet.create({
  surahCard: {
    padding: 12,
  },
  surahRow: {
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
  playButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});