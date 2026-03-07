import AppError from "@/components/AppError";
import AppLoading from "@/components/AppLoading";
import AppScreen from "@/components/AppScreen";
import QuranRow from "@/components/QuranRow";
import { EDITION1, getSurahAudioUrl, Surah } from "@/services/quranService";
import { useLanguageStore } from "@/store/languageStore";
import { useQuranPlayerStore } from "@/store/quranPlayerStore";
import { useThemeStore } from "@/store/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import TrackPlayer, { useProgress } from "react-native-track-player";

export default function QuranScreen() {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const tr = useLanguageStore((state) => state.tr);

    const surahs = useQuranPlayerStore((s) => s.surahs);
    const isLoading = useQuranPlayerStore((s) => s.isLoading);
    const error = useQuranPlayerStore((s) => s.error);
    const activeSurahNumber = useQuranPlayerStore((s) => s.activeSurahNumber);
    const isPlaying = useQuranPlayerStore((s) => s.isPlaying);
    const isBuffering = useQuranPlayerStore((s) => s.isBuffering);
    const hasFinished = useQuranPlayerStore((s) => s.hasFinished);
    const isSwitching = useQuranPlayerStore((s) => s.isSwitching);
    const syncPlayback = useQuranPlayerStore((s) => s.syncPlayback);
    const fetchSurahs = useQuranPlayerStore((s) => s.fetchSurahs);

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
    // Init: Fetch all surahs
    // ------------------------------------------------------------
    useEffect(() => {
        fetchSurahs();
    }, []);

    // ------------------------------------------------------------
    // Play / Pause / Replay handler
    // ------------------------------------------------------------
    const handlePlayPauseReplay = useCallback(async (surah: Surah) => {
        const currentTrack = await TrackPlayer.getActiveTrack();
        if (currentTrack && activeSurahNumber === surah.number) {
            if (hasFinished) {
                // replay from start
                await TrackPlayer.seekTo(0);
                await TrackPlayer.play();
            } else if (isPlaying) {
                // pause current
                await TrackPlayer.pause();
            } else {
                // play/resume current
                await TrackPlayer.play();
            }
            return;
        }

        // New surah → stop current, load and play new
        syncPlayback({
            isSwitching: true,
            activeSurahNumber: surah.number,
            activeSurahName: surah.englishName,
        });

        // Reset/Clear the foreground/live notification
        await TrackPlayer.reset();

        // Add new track and play
        const audioUrl = getSurahAudioUrl(surah.number);
        await TrackPlayer.add({
            id: `surah-${surah.number}`,
            url: audioUrl,
            title: surah.englishName,
            artist: EDITION1,
            isLiveStream: false,
        });
        await TrackPlayer.play();

        // Release listener control
        syncPlayback({ isSwitching: false });
    }, [activeSurahNumber, isPlaying, hasFinished]);

    // ------------------------------------------------------------
    // Stop handler
    // ------------------------------------------------------------
    const handleStop = useCallback(async (surah: Surah) => {
        if (activeSurahNumber === surah.number) {
            await TrackPlayer.stop();

            // Reset all playback-related state in the store
            syncPlayback({
                isActive: false,
                isPlaying: false,
                isBuffering: false,
                hasFinished: false,
                isSwitching: false,
                activeSurahNumber: null,
                activeSurahName: null,
            });

            // Reset/Clear the foreground/live notification
            await TrackPlayer.reset();
        }
    }, [activeSurahNumber]);

    // ------------------------------------------------------------
    // Filter surahs locally
    // ------------------------------------------------------------
    const filteredSurahs = useMemo(() => {
        if (!searchQuery.trim()) return surahs;

        const q = searchQuery.toLowerCase().trim();
        return surahs.filter((s) =>
            s.englishName.toLowerCase().includes(q) ||
            s.name.includes(q) ||
            String(s.number).includes(q)
        );
    }, [surahs, searchQuery]);

    // ------------------------------------------------------------
    // Render surah row
    // ------------------------------------------------------------
    const renderSurahItem = useCallback(({ item }: { item: Surah }) => {
        const isThisActive = activeSurahNumber === item.number;
        return (
            <QuranRow
                surah={item}
                theme={theme}
                activeSurahNumber={activeSurahNumber}
                // Only active row receives changed values
                isPlaying={isThisActive && isPlaying}
                isBufferingActive={isThisActive && isBufferingActive}
                hasFinished={isThisActive && hasFinished}
                currentProgress={isThisActive ? currentTime : 0}
                totalDuration={isThisActive ? duration : 0}
                onPlayPauseReplay={(surah) => handlePlayPauseReplay(surah)}
                onStop={(surah) => handleStop(surah)}
            />
        );
    }, [theme, isPlaying, isBuffering, hasFinished, activeSurahNumber, currentTime, duration, handlePlayPauseReplay, handleStop]);

    // Loading state
    if (isLoading) {
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
                onPress={fetchSurahs}
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
                    keyExtractor={(item) => String(item.number)}
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