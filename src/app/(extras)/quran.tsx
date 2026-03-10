import AppError from "@/components/AppError";
import AppLoading from "@/components/AppLoading";
import AppScreen from "@/components/AppScreen";
import QuranRow from "@/components/QuranRow";
import { EDITION_ALAFASY, getSurahAudioUrl, Surah } from "@/services/quranService";
import { useLanguageStore } from "@/store/languageStore";
import { useQuranStore } from "@/store/quranStore";
import { useThemeStore } from "@/store/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useRef, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import TrackPlayer, { useProgress } from "react-native-track-player";

export default function QuranScreen() {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const tr = useLanguageStore((state) => state.tr);

    // Quran Store
    const surahs = useQuranStore((s) => s.surahs);
    const activeSurahId = useQuranStore((s) => s.activeSurahId);
    const isQuranReady = useQuranStore((s) => s.isQuranReady);

    const isPlaying = useQuranStore((s) => s.isPlaying);
    const isBuffering = useQuranStore((s) => s.isBuffering);
    const hasFinished = useQuranStore((s) => s.hasFinished);
    const isSwitching = useQuranStore((s) => s.isSwitching);
    const error = useQuranStore((s) => s.error);
    const syncPlayback = useQuranStore((s) => s.syncPlayback);

    // Derived states from TrackPlayer hooks
    // Ticks every second, only needed by the active row
    const progress = useProgress(1000);
    const currentTime = isSwitching ? 0 : (progress.position ?? 0);
    const duration = isSwitching ? 0 : (progress.duration ?? 0);
    const isBufferingActive = isSwitching || isBuffering;

    // Local state / refs
    const [searchQuery, setSearchQuery] = useState("");
    const textInputRef = useRef<TextInput>(null);

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
            error: null,
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
                error: null,
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
    }, [surahs, searchQuery]);

    // ------------------------------------------------------------
    // Render surah row
    // ------------------------------------------------------------
    const renderSurahItem = useCallback(({ item }: { item: Surah }) => {
        const isThisActive = activeSurahId === item.id;
        return (
            <QuranRow
                surah={item}
                theme={theme}
                activeSurahId={activeSurahId}
                // Only active row receives changed values
                isPlaying={isThisActive && isPlaying}
                isBufferingActive={isThisActive && isBufferingActive}
                hasFinished={isThisActive && hasFinished}
                hasError={isThisActive && !!error}
                currentProgress={isThisActive ? currentTime : 0}
                totalDuration={isThisActive ? duration : 0}
                onPlayPauseReplay={(surah) => handlePlayPauseReplay(surah)}
                onStop={(surah) => handleStop(surah)}
            />
        );
    }, [theme, isPlaying, isBuffering, hasFinished, activeSurahId, currentTime, duration, error, handlePlayPauseReplay, handleStop]);

    // Loading state
    if (!isQuranReady) {
        return <AppLoading text={tr.labels.loading} />;
    }

    // Error state
    if (error) {
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

                {/* SEARCH bar */}
                <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.divider }]}>
                    <Ionicons name="search-outline" size={18} color={theme.placeholder} />
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

                {/* SURAH list */}
                <FlatList
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
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: theme.placeholder }]}>
                                {tr.labels.noSurahsFound ?? "No surahs found"}
                            </Text>
                        </View>
                    }
                />

            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
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