import AppCard from "@/components/AppCard";
import { useLanguageStore } from "@/store/languageStore";
import { useQuranStore } from "@/store/quranStore";
import { useThemeStore } from "@/store/themeStore";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function QuranContinueRead() {
  const router = useRouter();

  // Stores
  const theme = useThemeStore((s) => s.theme);
  const tr = useLanguageStore((s) => s.tr);

  // Quran Store
  const lastReadSurahId = useQuranStore((s) => s.lastReadSurahId);
  const lastReadSurahName = useQuranStore((s) => s.lastReadSurahName);
  const lastReadAyahId = useQuranStore((s) => s.lastReadAyahId);

  // Handle press to navigate to the last read Ayah
  const handlePress = () => {
    router.navigate({
      pathname: "/(extras)/quran/ayahs",
      params: {
        surahId: lastReadSurahId,
        surahName: lastReadSurahName,
      },
    });
  };

  if (!lastReadSurahId || !lastReadAyahId) return null;

  return (
    <AppCard style={[styles.card, { backgroundColor: theme.card, borderColor: theme.divider2 }]}>
      <TouchableOpacity style={styles.content} onPress={handlePress} activeOpacity={0.3}>
        <View style={styles.labelRow}>
          <MaterialCommunityIcons name="book-open-variant" size={22} color={theme.text2} />
          <Text style={[styles.label, { color: theme.text2 }]}>
            {tr.labels.continueReading}
          </Text>
        </View>
        <Text style={[styles.surahName, { color: theme.text }]}>
          {lastReadSurahName}
        </Text>
        <Text style={[styles.ayahNumber, { color: theme.text2 }]}>
          {tr.labels.ayah} {lastReadAyahId}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handlePress} hitSlop={8}>
        <Ionicons name="arrow-forward" size={26} color={theme.accent} style={{ marginRight: -4 }} />
      </TouchableOpacity>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginHorizontal: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  content: {
    flex: 1,
    gap: 10,
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "400",
    letterSpacing: 0.5,
    marginTop: 1,
  },

  surahName: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 2,
  },
  ayahNumber: {
    fontSize: 13,
    fontWeight: "400",
    letterSpacing: 0.5,
  },
});