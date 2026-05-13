import AppCard from "@/components/AppCard";
import AppError from "@/components/AppError";
import AppLoading from "@/components/AppLoading";
import AppTabScreen from "@/components/AppTabScreen";
import QuranReadingCard from "@/components/QuranReadingCard";
import QuranSurahRow from "@/components/QuranSurahRow";
import { AUDIO_EDITIONS, getSurahAudioUrl, Surah } from "@/services/quranService";
import { useLanguageStore } from "@/store/languageStore";
import { useQuranStore } from "@/store/quranStore";
import { useThemeStore } from "@/store/themeStore";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import TrackPlayer, { useProgress } from "react-native-track-player";

export default function QuranTabScreen() {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const tr = useLanguageStore((state) => state.tr);

  // Quran Store
  const surahs = useQuranStore((s) => s.surahs);
  const activeSurahId = useQuranStore((s) => s.activeSurahId);
  const quranError = useQuranStore((s) => s.quranError);
  const isQuranReady = useQuranStore((s) => s.isQuranReady);

  const isPlaying = useQuranStore((s) => s.isPlaying);
  const isBuffering = useQuranStore((s) => s.isBuffering);
  const hasFinished = useQuranStore((s) => s.hasFinished);
  const isSwitching = useQuranStore((s) => s.isSwitching);
  const playbackError = useQuranStore((s) => s.playbackError);
  const syncPlayback = useQuranStore((s) => s.syncPlayback);

  // Derived states from TrackPlayer hooks
  const progress = useProgress(1000);
  const currentTime = isSwitching ? 0 : (progress.position ?? 0);
  const duration = isSwitching ? 0 : (progress.duration ?? 0);
  const isBufferingActive = isSwitching || isBuffering;

  // Local state / refs
  const [searchQuery, setSearchQuery] = useState("");
  const textInputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList<Surah>>(null);

  // Must match the height in QuranSurahRow styles
  const ROW_HEIGHT = 90;
  const ROW_GAP = 10;

  // ------------------------------------------------------------
  // Play / Pause / Replay handler
  // ------------------------------------------------------------
  const handlePlayPauseReplay = useCallback(async (surah: Surah) => {
    const currentTrack = await TrackPlayer.getActiveTrack();
    if (currentTrack && activeSurahId === surah.id) {
      if (hasFinished) {
        // Replay from start
        await TrackPlayer.seekTo(0);
        await TrackPlayer.play();
      } else if (isPlaying) {
        // Pause current
        await TrackPlayer.pause();
      } else {
        // Resume current
        await TrackPlayer.play();
      }
      return;
    }

    // New surah → stop current, load and play new
    syncPlayback({
      isSwitching: true,
      activeSurahId: surah.id,
      activeSurahName: surah.transliteration,
      playbackError: null,
    });

    // Reset/Clear the foreground/live notification
    await TrackPlayer.reset();

    // Add new track and play
    const audioUrl = getSurahAudioUrl(surah.id);
    await TrackPlayer.add({
      id: `surah-${surah.id}`,
      url: audioUrl,
      title: surah.transliteration,
      artist: AUDIO_EDITIONS.alafasy,
      isLiveStream: false,
    });
    await TrackPlayer.play();

    // Release listener lock
    syncPlayback({ isSwitching: false });
  }, [activeSurahId, isPlaying, hasFinished]);

  // ------------------------------------------------------------
  // Stop handler
  // ------------------------------------------------------------
  const handleStop = useCallback(async (surah: Surah) => {
    if (activeSurahId === surah.id) {
      await TrackPlayer.stop();

      // Reset all playback-related state in the store
      syncPlayback({
        isActive: false,
        isPlaying: false,
        isBuffering: false,
        hasFinished: false,
        isSwitching: false,
        activeSurahId: null,
        activeSurahName: null,
        playbackError: null,
      });

      // Reset/Clear the foreground/live notification
      await TrackPlayer.reset();
    }
  }, [activeSurahId]);

  // ------------------------------------------------------------
  // Filter surahs locally based on search query
  // ------------------------------------------------------------
  const filteredSurahs = useMemo(() => {
    if (!surahs) return [];
    if (!searchQuery.trim()) return surahs;

    const q = searchQuery.toLowerCase().trim();
    return surahs.filter((surah) =>
      surah.id === activeSurahId ||
      surah.transliteration.toLowerCase().includes(q) ||
      surah.name.includes(q) ||
      String(surah.id).includes(q)
    );
  }, [surahs, searchQuery, activeSurahId]);

  // ------------------------------------------------------------
  // Scroll to active surah (shared logic)
  // ------------------------------------------------------------
  const scrollToPlaying = useCallback((animated = false) => {
    if (!activeSurahId || !surahs?.length) return;
    if (searchQuery !== "") return;

    const index = surahs.findIndex(s => s.id === activeSurahId);
    if (index === -1) return;

    flatListRef.current?.scrollToIndex({ index, animated });
  }, [activeSurahId, searchQuery, surahs]);

  // ------------------------------------------------------------
  // Scroll to active surah when screen is focused or search query changes
  // ------------------------------------------------------------
  useFocusEffect(
    useCallback(() => {
      scrollToPlaying(false);
    }, [scrollToPlaying])
  );

  // ------------------------------------------------------------
  // Scroll to active surah when search query changes (but not on focus)
  // ------------------------------------------------------------
  useEffect(() => {
    scrollToPlaying(true);
  }, [searchQuery]);

  // ------------------------------------------------------------
  // Scroll to the active surah
  // ------------------------------------------------------------
  const scrollToSurah = useCallback((info: { index: number; highestMeasuredFrameIndex: number }) => {
    // First scroll to the highest rendered row so the target gets laid out
    flatListRef.current?.scrollToIndex({
      index: Math.max(0, info.highestMeasuredFrameIndex),
      animated: false,
    });
    // Then scroll to the actual target after layout settles
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: info.index,
        animated: true,
        viewPosition: 0.4,
      });
    }, 100);
  }, []);

  // ------------------------------------------------------------
  // Render surah row
  // ------------------------------------------------------------
  const renderSurahItem = useCallback(({ item }: { item: Surah }) => {
    const isThisActive = activeSurahId === item.id;
    return (
      <QuranSurahRow
        surah={item}
        theme={theme}
        tr={tr}
        activeSurahId={activeSurahId}
        // Only active row receives changed values
        isPlaying={isThisActive && isPlaying}
        isBufferingActive={isThisActive && isBufferingActive}
        hasFinished={isThisActive && hasFinished}
        hasError={isThisActive && !!playbackError}
        currentProgress={isThisActive ? currentTime : 0}
        totalDuration={isThisActive ? duration : 0}
        rowHeight={ROW_HEIGHT}
        onPlayPauseReplay={(surah) => handlePlayPauseReplay(surah)}
        onStop={(surah) => handleStop(surah)}
      />
    );
  }, [theme, tr, activeSurahId, isPlaying, hasFinished, playbackError, currentTime, duration]);

  // Loading state
  if (!isQuranReady) {
    return <AppLoading text={tr.labels.loading} />;
  }

  // Error state
  if (quranError) {
    return (
      <AppError
        icon="cloud-offline-outline"
        iconColor={theme.danger}
        message={tr.labels.quranSurahsError}
        buttonText={tr.buttons.retry}
        buttonColor={theme.danger}
        onPress={() => useQuranStore.getState().loadFullQuran()}
      />
    );
  }

  return (
    <AppTabScreen>
      <View style={[styles.container, { backgroundColor: theme.bg }]}>

        {/* Hero Header Section */}
        <AppCard style={styles.topPanel}>

          {/* Quran title + subtitle + Favorites + Settings */}
          <View style={styles.panelHeader}>
            {/* Left: Icon */}
            <View style={[styles.headerIconContainer, { backgroundColor: `${theme.gold}20` }]}>
              <View style={{ position: 'absolute', top: 6 }}>
                <Ionicons name="volume-medium" size={14} color={theme.gold} />
              </View>
              <MaterialCommunityIcons name="book-open-variant" style={{ paddingTop: 8 }} size={32} color={theme.gold} />
            </View>

            {/* Center: Title and Subtitle */}
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>{tr.labels.quran}</Text>
              <Text style={[styles.headerSubtitle, { color: theme.text2 }]}>{tr.labels.quranDesc}</Text>
            </View>

            {/* Right: Favorites + Settings */}
            <View style={styles.topPanelIcons}>
              <TouchableOpacity
                delayPressIn={0}
                delayPressOut={0}
                activeOpacity={0.3}
                onPress={() => router.navigate('/(quran)/ayahsFavorites')}
              >
                <Ionicons name="bookmark-outline" size={24} color={theme.gold} />
              </TouchableOpacity>
              <TouchableOpacity
                delayPressIn={0}
                delayPressOut={0}
                activeOpacity={0.3}
                onPress={() => router.navigate('/(modals)/quranSettings')}
              >
                <Ionicons name="settings-outline" size={24} color={theme.text2} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.divider2 }]} />

          {/* Reading / Khatam card */}
          <QuranReadingCard />

          {/* SEARCH bar */}
          <View style={[styles.searchInputContainer, { backgroundColor: theme.overlayLight, borderColor: theme.border }]}>
            <Ionicons name="search-outline" size={20} color={theme.text2} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              ref={textInputRef}
              placeholder={tr.labels.searchPlaceholder ?? "Search..."}
              placeholderTextColor={theme.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color={theme.placeholder} />
              </TouchableOpacity>
            )}
          </View>

        </AppCard>

        {/* SURAH list */}
        <FlatList
          ref={flatListRef}
          data={filteredSurahs}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderSurahItem}
          contentContainerStyle={styles.surahList}
          showsVerticalScrollIndicator={false}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews={true}
          onMomentumScrollBegin={() => textInputRef.current?.blur()}
          onScrollToIndexFailed={(info) => scrollToSurah(info)}
          getItemLayout={(_, index) => ({
            length: ROW_HEIGHT,
            offset: (ROW_HEIGHT + ROW_GAP) * index,
            index
          })}
        />

      </View>
    </AppTabScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Single top panel AppCard
  topPanel: {
    marginTop: 12,
    marginBottom: 12,
    marginHorizontal: 8,
    paddingTop: 24,
    paddingBottom: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  headerIconContainer: {
    width: 58,
    height: 58,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "700",
    lineHeight: 22,
    letterSpacing: -0.2,
    paddingBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    opacity: 0.7,
    lineHeight: 20,
  },
  topPanelIcons: {
    marginLeft: 'auto',
    marginRight: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22
  },
  divider: {
    height: 1,
  },

  // Search
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "400",
    padding: 0,
  },
  surahList: {
    paddingHorizontal: 8,
    paddingBottom: 24,
    gap: 10,
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "400",
  },
});
