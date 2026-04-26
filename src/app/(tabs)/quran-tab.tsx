import AppCard from "@/components/AppCard";
import AppTabScreen from "@/components/AppTabScreen";
import { useLanguageStore } from "@/store/languageStore";
import { useQuranStore } from "@/store/quranStore";
import { useThemeStore } from "@/store/themeStore";
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface MenuItem {
  id: number;
  type: 'internal' | 'external';
  href: any;
  label: string;
  description: string;
  color: string;
  bg: string;
  icon: any;
  comingSoon?: boolean;
}

export default function QuranScreen() {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const tr = useLanguageStore((state) => state.tr);

  // Quran store
  const lastReadSurahId = useQuranStore((s) => s.lastReadSurahId);
  const lastReadSurahName = useQuranStore((s) => s.lastReadSurahName);
  const lastReadAyahId = useQuranStore((s) => s.lastReadAyahId);

  // Start reading defaults
  const FIRST_SURAH_ID = 1;
  const FIRST_SURAH_NAME = "Al-Fatihah";
  const FIRST_AYAH_ID = 1;

  // Colors
  const QURAN_COLOR = "#d1a127";
  const QURAN_BG = "#d1a12726";

  const features: MenuItem[] = [
    {
      id: 1,
      href: "(quran)/surahs",
      type: 'internal',
      label: tr.labels.quranSurahs || "Surahs",
      description: tr.labels.quranDesc || "Read and explore the Quran",
      color: QURAN_COLOR,
      bg: QURAN_BG,
      icon: <MaterialCommunityIcons name="format-list-text" style={{ paddingTop: 14 }} size={28} color={QURAN_COLOR} />,
    },
    {
      id: 2,
      href: "(modals)/quranSettings",
      type: 'internal',
      label: tr.labels.quranSettingsTitle || "Quran Settings",
      description: tr.labels.quranSettingsSubtitle || "Customize font & translation",
      color: "#6366f1",
      bg: "#6366f126",
      icon: <MaterialCommunityIcons name="cog-outline" size={32} color="#6366f1" />,
    },
    {
      id: 3,
      href: "(quran)/surahs",
      type: 'internal',
      label: tr.labels.quranBookmarks || "Bookmarks",
      description: tr.labels.quranBookmarksDesc || "Your saved ayahs and surahs",
      color: "#f59e0b",
      bg: "#f59e0b26",
      icon: <MaterialCommunityIcons name="bookmark-outline" size={32} color="#f59e0b" />,
      comingSoon: true,
    },
    {
      id: 4,
      href: "(quran)/surahs",
      type: 'internal',
      label: tr.labels.quranListeningHistory || "Listening History",
      description: tr.labels.quranListeningHistoryDesc || "Recently played surahs and recitations",
      color: "#10b981",
      bg: "#10b98126",
      icon: <MaterialCommunityIcons name="history" size={32} color="#10b981" />,
      comingSoon: true,
    },
  ];

  return (
    <AppTabScreen>
      <ScrollView
        style={[styles.scrollContainer, { backgroundColor: theme.bg }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header */}
        <AppCard style={styles.headerCard}>
          <View style={[styles.headerIconContainer, { backgroundColor: QURAN_BG }]}>
            <MaterialCommunityIcons name="book-open-variant" size={52} color={QURAN_COLOR} />
          </View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {tr.labels.quran || "The Noble Quran"}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.text2 }]}>
            {tr.labels.quranHeroSubtitle || "Read & listen to the Holy Quran"}
          </Text>
        </AppCard>

        {/* START/CONTINUE Reading Card */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            router.navigate({
              pathname: "/(quran)/ayahs",
              params: {
                surahId: lastReadSurahId ?? FIRST_SURAH_ID,
                surahName: lastReadSurahName ?? FIRST_SURAH_NAME,
              },
            });
          }}
        >
          <AppCard style={[styles.continueCard, { borderLeftWidth: 2, borderLeftColor: QURAN_COLOR }]}>
            <View style={styles.continueContent}>
              <View style={styles.continueLabelRow}>
                <MaterialCommunityIcons name="book-open-variant" size={16} color={theme.text2} />
                <Text style={[styles.continueLabel, { color: theme.text2, opacity: 0.7 }]}>
                  {lastReadSurahId ? tr.labels.continueReading : tr.labels.startReading}
                </Text>
              </View>
              <Text style={[styles.continueSurahName, { color: theme.text }]} numberOfLines={1}>
                {lastReadSurahName ?? FIRST_SURAH_NAME}
              </Text>
              <Text style={[styles.continueAyahText, { color: theme.text2, opacity: 0.7 }]}>
                {lastReadAyahId
                  ? `${tr.labels.ayah} ${lastReadAyahId}`
                  : `${tr.labels.ayah} ${FIRST_AYAH_ID}`}
              </Text>
            </View>
            <MaterialIcons name="arrow-right-alt" size={40} color={theme.accent} style={{ marginRight: -6 }} />
          </AppCard>
        </TouchableOpacity>

        {/* Feature Grid */}
        <View style={styles.grid}>
          {features.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [styles.gridItemWrapper, { opacity: item.comingSoon ? 1 : pressed ? 0.3 : 1 }]}
              android_ripple={item.comingSoon ? undefined : { color: theme.shadow, borderless: false }}
              onPress={item.comingSoon ? undefined : () => router.navigate(item.href)}
              disabled={item.comingSoon}
            >
              <AppCard style={item.comingSoon
                ? [styles.gridCard, styles.gridCardDisabled, { borderColor: theme.border }]
                : styles.gridCard
              }>
                {/* Coming Soon badge */}
                {item.comingSoon && (
                  <View style={[styles.comingSoonBadge, { backgroundColor: theme.bg3 }]}>
                    <Text style={[styles.comingSoonText, { color: theme.placeholder }]}>{tr.labels.comingSoon || "Soon"}</Text>
                  </View>
                )}
                <View style={[styles.gridIconContainer, { backgroundColor: item.bg, opacity: item.comingSoon ? 0.4 : 1 }]}>
                  {item.icon}
                  {item.id === 1 && (
                    <View style={styles.gridIconBadge}>
                      <Ionicons name="volume-medium" size={16} color={item.color} />
                    </View>
                  )}
                </View>
                <Text style={[styles.gridTitle, { color: theme.text, opacity: item.comingSoon ? 0.35 : 1 }]} numberOfLines={2}>
                  {item.label}
                </Text>
                <Text style={[styles.gridDescription, { color: theme.text2, opacity: item.comingSoon ? 0.35 : 0.7 }]} numberOfLines={2}>
                  {item.description}
                </Text>
              </AppCard>
            </Pressable>
          ))}
        </View>

      </ScrollView>
    </AppTabScreen>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 8,
    gap: 12,
  },

  // Hero Header
  headerCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  headerIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    opacity: 0.8,
  },

  // Continue Reading Card
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  continueLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  continueContent: {
    flex: 1,
    gap: 4,
  },
  continueLabel: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.4,
    marginTop: 1,
  },
  continueSurahName: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  continueAyahText: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0.3,
  },

  // Feature Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'stretch',
  },
  gridItemWrapper: {
    width: '48.5%',
    flexDirection: 'column',
  },
  gridCard: {
    flex: 1,
    padding: 16,
    gap: 10,
    alignItems: 'center',
  },
  gridIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  gridIconBadge: {
    position: 'absolute',
    top: 6,
    left: '50%',
    marginLeft: -8,
  },
  gridTitle: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
    textAlign: 'center',
  },
  gridDescription: {
    fontSize: 14,
    lineHeight: 19,
    opacity: 0.7,
    textAlign: 'center',
  },

  // Coming Soon
  gridCardDisabled: {
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
