import { useLanguageStore } from "@/store/languageStore";
import { useQuranStore } from "@/store/quranStore";
import { useThemeStore } from "@/store/themeStore";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type ReadingMode = "reading" | "khatam";

const FIRST_SURAH_ID = 1;
const FIRST_SURAH_NAME = "Al-Fatihah";
const FIRST_AYAH_ID = 1;

export default function QuranReadingCard() {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const tr = useLanguageStore((state) => state.tr);

  // Quran Store - Reading
  const lastReadSurahId = useQuranStore((state) => state.lastReadSurahId);
  const lastReadSurahName = useQuranStore((state) => state.lastReadSurahName);
  const lastReadAyahId = useQuranStore((state) => state.lastReadAyahId);
  // Quran Store - Khatam
  const lastKhatamSurahId = useQuranStore((state) => state.lastKhatamSurahId);
  const lastKhatamSurahName = useQuranStore((state) => state.lastKhatamSurahName);
  const lastKhatamAyahId = useQuranStore((state) => state.lastKhatamAyahId);
  const khatamCount = useQuranStore((state) => state.khatamCount);
  const resetKhatam = useQuranStore((state) => state.resetKhatam);

  // Local state
  const [mode, setMode] = useState<ReadingMode>("reading");

  // Determine which set of position data to use based on mode
  const isReading = mode === "reading";
  const surahId = isReading ? lastReadSurahId : lastKhatamSurahId;
  const surahName = isReading ? lastReadSurahName : lastKhatamSurahName;
  const ayahId = isReading ? lastReadAyahId : lastKhatamAyahId;
  const hasStarted = isReading ? !!lastReadSurahId : !!lastKhatamSurahId;

  // ------------------------------------------------------------
  // Card label logic
  // ------------------------------------------------------------
  const cardLabel = hasStarted
    ? (isReading ? tr.labels.continueReading : tr.labels.continueKhatam)
    : (isReading ? tr.labels.startReading : tr.labels.startKhatam);

  // ------------------------------------------------------------
  // Handle card press
  // ------------------------------------------------------------
  const handlePress = () => {
    router.navigate({
      pathname: "/(quran)/ayahs",
      params: {
        surahId: surahId ?? FIRST_SURAH_ID,
        surahName: surahName ?? FIRST_SURAH_NAME,
        readingMode: mode,
      },
    });
  };

  // ------------------------------------------------------------
  // Handle Khatam reset
  // ------------------------------------------------------------
  const handleReset = () => {
    Alert.alert(
      tr.labels.khatamResetTitle,
      tr.labels.khatamResetMessage,
      [
        { text: tr.buttons.cancel, style: "cancel" },
        { text: tr.labels.khatamReset, style: "destructive", onPress: resetKhatam },
      ]
    );
  };

  return (
    <View style={styles.container}>

      {/* View Mode toggle Buttons */}
      <View style={[styles.toggleRow, { backgroundColor: theme.overlayLight, borderColor: theme.border }]}>
        {(["reading", "khatam"] as ReadingMode[]).map((m) => (
          <TouchableOpacity
            key={m}
            activeOpacity={0.7}
            style={[styles.toggleBtn, mode === m && { backgroundColor: theme.card, borderColor: theme.borderCard, borderWidth: 0.4 }]}
            onPress={() => setMode(m)}
          >
            <Text style={[styles.toggleBtnText, { color: mode === m ? theme.text : theme.text2 }]}>
              {m === "reading" ? tr.labels.read : tr.labels.khatam}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Reading mode Card */}
      <TouchableOpacity activeOpacity={0.7} onPress={handlePress}>
        <View style={[styles.card, { backgroundColor: theme.overlayLight, borderColor: theme.border, borderLeftColor: theme.gold }]}>

          {/* Main content */}
          <View style={styles.cardMain}>
            <View style={styles.cardContent}>
              <Text style={[styles.cardLabel, { color: theme.text2 }]}>{cardLabel}</Text>
              <Text style={[styles.surahName, { color: theme.text }]}>
                {surahName ?? FIRST_SURAH_NAME}
              </Text>
              <Text style={[styles.ayahNumber, { color: theme.text2 }]}>
                {ayahId ? `${tr.labels.ayah} ${ayahId}` : `${tr.labels.ayah} ${FIRST_AYAH_ID}`}
              </Text>
            </View>
            <MaterialIcons name="arrow-right-alt" size={36} color={theme.gold} />
          </View>

          {/* Khatam footer: inside card, separated by divider */}
          {!isReading && (
            <>
              <View style={[styles.cardDivider, { backgroundColor: theme.divider2 }]} />
              <View style={styles.khatamFooter}>
                <View style={styles.khatamCountContainer}>
                  {/* Count */}
                  <Text style={[styles.khatamCountText, { color: theme.textMuted }]}>
                    {khatamCount}
                  </Text>
                  {/* Label */}
                  <Text style={[styles.khatamCountLabel, { color: theme.textMuted }]}>
                    × {tr.labels.khatam}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleReset}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="refresh-outline" size={18} color={theme.placeholder} />
                </TouchableOpacity>
              </View>
            </>
          )}

        </View>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },

  // Toggle buttons
  toggleRow: {
    overflow: "hidden",
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 8,
    padding: 3,
    gap: 6,
  },
  toggleBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 19,
    paddingVertical: 7,
    borderRadius: 6,
  },
  toggleBtnText: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.4,
  },

  // Dynamic Card
  card: {
    borderRadius: 10,
    borderWidth: 1,
    borderLeftWidth: 2,
    overflow: "hidden",
  },
  cardMain: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardContent: {
    flex: 1,
    gap: 5,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: "400",
    letterSpacing: 0.5,
    fontStyle: "italic",
    opacity: 0.7,
  },
  surahName: {
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  ayahNumber: {
    fontSize: 13,
    fontWeight: "400",
    opacity: 0.6,
  },

  // Khatam footer (inside card)
  cardDivider: {
    height: 1,
    marginHorizontal: 14,
  },
  khatamFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 6,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  khatamCountContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  khatamCountText: {
    fontSize: 12,
    fontWeight: "700",
  },
  khatamCountLabel: {
    fontSize: 12,
  },
});
