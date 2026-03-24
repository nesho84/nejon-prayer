import AppCard from "@/components/AppCard";
import AppError from "@/components/AppError";
import AppLoading from "@/components/AppLoading";
import AppScreen from "@/components/AppScreen";
import QuranContinueRead from "@/components/QuranContinueRead";
import QuranRow from "@/components/QuranRow";
import { EDITION_ALAFASY, getSurahAudioUrl, Surah } from "@/services/quranService";
import { useLanguageStore } from "@/store/languageStore";
import { useQuranStore } from "@/store/quranStore";
import { useThemeStore } from "@/store/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import TrackPlayer, { useProgress } from "react-native-track-player";

export default function QuranScreen() {
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

    // Must match the height in QuranRow styles
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
            artist: EDITION_ALAFASY,
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
    // Scroll to active surah after unmount or search query clear
    // ------------------------------------------------------------
    useEffect(() => {
        if (!activeSurahId || !surahs?.length) return;
        if (searchQuery !== "") return;

        const index = surahs.findIndex(s => s.id === activeSurahId);
        if (index === -1) return;

        flatListRef.current?.scrollToIndex({ index, animated: true });
    }, [activeSurahId, searchQuery, surahs]);

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
            <QuranRow
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
    }, [theme, tr, isPlaying, isBufferingActive, hasFinished, activeSurahId, currentTime, duration, playbackError, handlePlayPauseReplay, handleStop]);

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
        <AppScreen>
            <View style={[styles.container, { backgroundColor: theme.bg }]}>
                {/* Continue Reading Card */}
                <QuranContinueRead />

                {/* SEARCH bar */}
                <AppCard style={[styles.searchInputContainer, { backgroundColor: theme.card, borderColor: theme.divider2 }]}>
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
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 16,
        marginBottom: 6,
        marginHorizontal: 16,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
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
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 48,
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