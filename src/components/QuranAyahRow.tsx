import { Verse } from '@/types/quran.types';
import { ThemeColors } from "@/types/theme.types";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React from "react";
import { Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  surahId: number;
  surahName: string;
  verse: Verse;               // Arabic — always from local JSON
  translation: string | null; // User language — from API, null if Arabic
  theme: ThemeColors;
  arabicFontSize: number;
  translationFontSize: number;
  isSelected: boolean;
  isAyahFavorited: boolean;
  onPress: () => void;
  onToggleAyahFavorite: () => void;
}

// Main Component (memoized for FlatList performance)
const QuranAyahRow = React.memo(({
  surahId,
  surahName,
  verse,
  translation,
  theme,
  arabicFontSize,
  translationFontSize,
  isSelected,
  isAyahFavorited,
  onPress,
  onToggleAyahFavorite,
}: Props) => {
  // ------------------------------------------------------------
  // Share text cross-platform
  // ------------------------------------------------------------
  const handleShare = async () => {
    const title = `${surahId}) ${surahName}, Ayah ${verse.id}`;
    const message = translation ? `${verse.text}\n\n${translation}` : verse.text;
    try {
      await Share.share(
        {
          title: title,
          message: `${title}\n\n${message}`,
        },
        {
          dialogTitle: title,
          subject: title,
        }
      );
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  // ------------------------------------------------------------
  // Copy text (title + message)
  // ------------------------------------------------------------
  const handleCopy = async () => {
    const title = `${surahId}) ${surahName}, Ayah ${verse.id}`;
    const message = translation ? `${verse.text}\n\n${translation}` : verse.text;
    try {
      const textToCopy = `${title}\n\n${message}`;
      await Clipboard.setStringAsync(textToCopy);
    } catch (err) {
      console.error("❌ Copy failed:", err);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View
        style={[
          styles.container,
          isSelected && { backgroundColor: theme.accentLight },
        ]}
      >

        {/* Top bar */}
        <View style={styles.topBar}>
          {/* Ayah number badge — surahId:ayahNumber */}
          <View style={[styles.badge, { backgroundColor: theme.accentLight, borderColor: theme.accent }]}>
            <Text style={[styles.badgeText, { color: theme.accent }]}>
              {surahId}:{verse.id}
            </Text>
          </View>

          {/* Share + Copy + Bookmark */}
          <View style={styles.icons}>
            {/* Share button */}
            <TouchableOpacity onPress={handleShare} hitSlop={8}>
              <Ionicons name="share-social-outline" size={22} color={theme.accent} />
            </TouchableOpacity>
            {/* Copy button */}
            <TouchableOpacity onPress={handleCopy} hitSlop={8}>
              <Ionicons name="copy-outline" size={22} color={theme.accent} />
            </TouchableOpacity>
            {/* Bookmark button */}
            <TouchableOpacity onPress={onToggleAyahFavorite} hitSlop={8}>
              <Ionicons
                name={isAyahFavorited ? "bookmark" : "bookmark-outline"}
                size={22}
                color={isAyahFavorited ? theme.info : theme.accent}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Arabic text */}
        <Text style={[styles.arabicText, { color: theme.accent, fontSize: arabicFontSize, lineHeight: arabicFontSize * 1.85 }]}>
          {verse.text}
        </Text>

        {/* Translation */}
        {translation && (
          <Text style={[styles.translationText, { color: theme.text, fontSize: translationFontSize, lineHeight: translationFontSize * 1.55 }]}>
            {translation}
          </Text>
        )}

      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: theme.divider }]} />

    </TouchableOpacity>
  );
});

export default QuranAyahRow;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  icons: {
    flexDirection: "row",
    gap: 36,
  },
  arabicText: {
    fontSize: 26,
    lineHeight: 48,
    textAlign: "right",
    marginBottom: 12,
  },
  translationText: {
    fontSize: 18,
    lineHeight: 28,
    textAlign: "justify",
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
});