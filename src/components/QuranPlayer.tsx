import { useQuranPlayerStore } from "@/store/quranPlayerStore";
import { useThemeStore } from "@/store/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

export default function QuranActiveIndicator() {
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
      <Ionicons name="play-circle" size={16} color={theme.accent} />
      <Text style={[styles.text, { color: theme.accent }]} numberOfLines={1}>
        {activeSurahName ?? "Quran is playing"}
      </Text>
      <Ionicons name="chevron-forward-outline" size={16} color={theme.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  text: {
    fontSize: 14,
    fontWeight: "500",
    flexShrink: 1,
  },
});