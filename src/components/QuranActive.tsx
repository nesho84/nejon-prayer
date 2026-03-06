import { useQuranPlayerStore } from "@/store/quranPlayerStore";
import { useThemeStore } from "@/store/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function QuranActive() {
  // Sores
  const theme = useThemeStore((s) => s.theme);
  const isPlaying = useQuranPlayerStore((s) => s.isPlaying);
  const activeSurahName = useQuranPlayerStore((s) => s.activeSurahName);

  const router = useRouter();

  // Don't render if no active session
  if (!isPlaying) return null;

  return (
    <Pressable
      onPress={() => router.navigate("/quran")}
      style={[styles.container, { backgroundColor: theme.card, borderColor: theme.divider }]}
    >
      <View style={styles.textContainer}>
        <Ionicons name="play-circle" size={16} color={theme.accent} />
        <Text style={[styles.text, { color: theme.accent }]} numberOfLines={1}>
          {activeSurahName ?? "Quran is playing"}
        </Text>
      </View>
      <Ionicons name="chevron-forward-outline" size={16} color={theme.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  textContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  text: {
    fontSize: 14,
    fontWeight: "500",
    flexShrink: 1,
  },
});