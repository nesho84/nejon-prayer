import AppCard from "@/components/AppCard";
import AppError from "@/components/AppError";
import AppLayout from "@/components/AppLayout";
import AppLoading from "@/components/AppLoading";
import QuranReadingCard from "@/components/QuranReadingCard";
import QuranSurahRow from "@/components/QuranSurahRow";
import { globalStyles } from "@/constants/styles";
import { getQuranPlayer, isSurahLoaded, pausePlayback, playSurah, replayFromStart, resumePlayback, stopPlayback } from "@/services/quranPlayerService";
import { useLanguageStore } from "@/store/languageStore";
import { useQuranPlayerStore } from "@/store/quranPlayerStore";
import { useQuranStore } from "@/store/quranStore";
import { useThemeStore } from "@/store/themeStore";
import { Surah } from '@/types/quran.types';
import { Ionicons } from "@react-native-vector-icons/ionicons/static";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons/static";
import { useAudioPlayerStatus } from "expo-audio";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function QuranTabScreen() {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const tr = useLanguageStore((state) => state.tr);

  // Quran Store
  const surahs = useQuranStore((state) => state.surahs);
  const activeSurahId = useQuranPlayerStore((state) => state.activeSurahId);
  const quranError = useQuranStore((state) => state.quranError);
  const isQuranReady = useQuranStore((state) => state.isQuranReady);

  // Playback-related state from the store
  const isPlaying = useQuranPlayerStore((state) => state.isPlaying);
  const isBuffering = useQuranPlayerStore((state) => state.isBuffering);
  const hasFinished = useQuranPlayerStore((state) => state.hasFinished);
  const isSwitching = useQuranPlayerStore((state) => state.isSwitching);
  const playbackError = useQuranPlayerStore((state) => state.playbackError);
  const syncPlayback = useQuranPlayerStore((state) => state.syncPlayback);

  // Derived states from the player status (1s cadence set at player creation)
  const status = useAudioPlayerStatus(getQuranPlayer());
  const currentTime = isSwitching ? 0 : (status.currentTime ?? 0);
  const duration = isSwitching ? 0 : (status.duration ?? 0);
  const isBufferingActive = isSwitching || isBuffering;

  // Local state / refs
  const [searchQuery, setSearchQuery] = useState("");
  const [headerHeight, setHeaderHeight] = useState(0);
  const textInputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList<Surah>>(null);

  // Orientation
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // Safe area insets
  const insets = useSafeAreaInsets();
  const topInset = insets.top + 4;
  const bottomInset = insets.bottom + 12;

  // Must match the height in QuranSurahRow styles
  const ROW_HEIGHT = 90;
  const ROW_GAP = 10;

  // ------------------------------------------------------------
  // Play / Pause / Replay handler
  // ------------------------------------------------------------
  const handlePlayPauseReplay = useCallback(async (surah: Surah) => {
    try {
      if (isSurahLoaded() && activeSurahId === surah.id) {
        if (hasFinished) {
          // Replay from start
          await replayFromStart();
        } else if (isPlaying) {
          // Pause current
          pausePlayback();
        } else {
          // Resume current
          resumePlayback();
        }
        return;
      }

      // New surah → mark active (handlers own isActive, the status listener doesn't write it)
      // isBuffering starts true so the spinner survives the gap until the first status tick
      syncPlayback({
        isSwitching: true,
        isActive: true,
        isBuffering: true,
        hasFinished: false,
        activeSurahId: surah.id,
        activeSurahName: surah.transliteration,
        playbackError: null,
      });

      // Load and play + take over the lock-screen/notification controls.
      // isSwitching stays true until the status listener sees the first playing/error tick —
      // releasing it earlier lets stale currentTime/duration ticks flash the progress bar.
      await playSurah(surah.id, surah.transliteration);
    } catch (err) {
      console.error('❌ [quran-tab] Playback failed:', err);
      syncPlayback({ playbackError: err instanceof Error ? err.message : String(err), isPlaying: false, isBuffering: false, isSwitching: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSurahId, isPlaying, hasFinished]);

  // ------------------------------------------------------------
  // Stop handler
  // ------------------------------------------------------------
  const handleStop = useCallback(async (surah: Surah) => {
    if (activeSurahId !== surah.id) return;
    // Reset the store first — with activeSurahId null the status listener ignores the
    // pause/seek ticks emitted while stopping, so the row can't flicker
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
    try {
      // Stops playback and clears the lock-screen/notification controls
      await stopPlayback();
    } catch (err) {
      console.error('❌ [quran-tab] Stop failed:', err);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

    flatListRef.current?.scrollToIndex({
      index,
      animated
    });
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // Header + Search bar - Fixed in portrait, scrollable in landscape
  // ------------------------------------------------------------
  const renderHeader = (
    <AppCard
      style={[styles.topPanel, isLandscape ? { marginHorizontal: 0, marginBottom: 4 } : {}]}
      onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
    >
      {/* Quran title + subtitle + Favorites + Settings */}
      <View style={styles.panelHeader}>
        {/* Left: Icon */}
        <View style={[styles.headerIconContainer, { backgroundColor: `${theme.gold}20` }]}>
          <View style={{ position: 'absolute', top: 6 }}>
            <Ionicons name="volume-medium" size={14} color={theme.gold} />
          </View>
          <MaterialDesignIcons name="book-open-variant" style={{ paddingTop: 8 }} size={32} color={theme.gold} />
        </View>

        {/* Center: Title and Subtitle */}
        <View style={styles.headerTextCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{tr.labels.quran}</Text>
          <Text style={[styles.headerSubtitle, { color: theme.text2 }]}>{tr.labels.quranDesc}</Text>
        </View>

        {/* Right: Favorites + Settings */}
        <View style={styles.headerRightIcons}>
          <TouchableOpacity
            delayPressIn={0}
            delayPressOut={0}
            activeOpacity={0.3}
            onPress={() => router.navigate('/quran/ayahs-fav')}
          >
            <Ionicons name="bookmarks-outline" size={22} color={theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            delayPressIn={0}
            delayPressOut={0}
            activeOpacity={0.3}
            onPress={() => router.navigate('/(modals)/quranSettings')}
          >
            <Ionicons name="settings-outline" size={24} color={theme.textSecondary} />
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
  );

  // ------------------------------------------------------------
  // Render surah row
  // ------------------------------------------------------------
  const renderSurahItem = useCallback(({ item }: { item: Surah }) => {
    const active = activeSurahId === item.id;
    return (
      <QuranSurahRow
        surah={item}
        theme={theme}
        tr={tr}
        activeSurahId={activeSurahId}
        // Only active row receives changed values
        isPlaying={active && isPlaying}
        isBufferingActive={active && isBufferingActive}
        hasFinished={active && hasFinished}
        hasError={active && !!playbackError}
        currentProgress={active ? currentTime : 0}
        totalDuration={active ? duration : 0}
        rowHeight={ROW_HEIGHT}
        onPlayPauseReplay={(surah) => handlePlayPauseReplay(surah)}
        onStop={(surah) => handleStop(surah)}
      />
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <AppLayout>
      <View style={[
        globalStyles.container,
        { paddingTop: !isLandscape ? topInset : 0, backgroundColor: theme.bg }
      ]}>

        {/* Header Section */}
        {!isLandscape && renderHeader}

        {/* SURAH List */}
        <FlatList
          ref={flatListRef}
          data={filteredSurahs}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={isLandscape ? renderHeader : null}
          renderItem={renderSurahItem}
          contentContainerStyle={[
            styles.surahList,
            { paddingTop: isLandscape ? topInset : 0, paddingBottom: bottomInset }
          ]}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={21}
          removeClippedSubviews={true}
          onMomentumScrollBegin={() => textInputRef.current?.blur()}
          onScrollToIndexFailed={(info) => scrollToSurah(info)}
          getItemLayout={(_, idx) => ({
            length: ROW_HEIGHT,
            offset: (isLandscape ? headerHeight : 0) + (ROW_HEIGHT + ROW_GAP) * idx,
            index: idx
          })}
        />

      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  // Single top panel AppCard
  topPanel: {
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
  headerTextCenter: {
    flex: 1,
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
  headerRightIcons: {
    marginLeft: 'auto',
    // alignSelf: 'flex-start',
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

  // Surah list
  surahList: {
    paddingHorizontal: 8,
    gap: 10,
  },
});
