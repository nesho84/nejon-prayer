import AppError from "@/components/AppError";
import AppLoading from "@/components/AppLoading";
import AppScreen from "@/components/AppScreen";
import QuranRow from "@/components/QuranRow";
import { EDITION1, fetchAllSurahs, getSurahAudioUrl, Surah } from "@/services/quranService";
import { setupTrackPlayer } from "@/services/trackPlayerService";
import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import TrackPlayer, { State, usePlaybackState, useProgress } from "react-native-track-player";

export default function QuranScreen() {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const tr = useLanguageStore((state) => state.tr);

    // TrackPlayer hooks
    const { state } = usePlaybackState();
    const progress = useProgress(1000);

    // Local state
    const [surahs, setSurahs] = useState<Surah[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Sound preview state
    const [activeSurahNumber, setActiveSurahNumber] = useState<number | null>(null);
    const [activeSurahName, setActiveSurahName] = useState<string | null>(null);
    const [isSwitching, setIsSwitching] = useState<boolean>(false);

    // Derived states
    const isPlaying = state === State.Playing;
    const isBuffering = isSwitching || state === State.Buffering;
    const hasFinished = state === State.Ended;
    const currentTime = isSwitching ? 0 : (progress.position ?? 0);
    const duration = isSwitching ? 0 : (progress.duration ?? 0);

    // Refs
    const isFetchMountedRef = useRef(true);
    const textInputRef = useRef<TextInput>(null);

    // ------------------------------------------------------------
    // Load surahs from API
    // ------------------------------------------------------------
    const fetchSurahs = async () => {
        if (!isFetchMountedRef.current) return;

        setIsLoading(true);
        setError(null);

        try {
            const data = await fetchAllSurahs();

            if (isFetchMountedRef.current) {
                setSurahs(data);
            }
        } catch (err) {
            console.error("❌ Failed to load surahs:", err);
            if (isFetchMountedRef.current) {
                setError(tr.labels.quranSurahsError);
            }
        } finally {
            if (isFetchMountedRef.current) {
                setIsLoading(false);
            }
        }
    };

    // ------------------------------------------------------------
    // Fetch all surahs on mount
    // ------------------------------------------------------------
    useEffect(() => {
        isFetchMountedRef.current = true;

        fetchSurahs();

        return () => {
            isFetchMountedRef.current = false;
        };
    }, []);

    // ------------------------------------------------------------
    // Setup and Sync TrackPlayer
    // ------------------------------------------------------------
    useEffect(() => {
        const setupAndSync = async () => {
            // Setup TrackPlayer once on mount
            await setupTrackPlayer();

            // Sync active track (case: start audio, leave app, then comes back)
            const currentTrack = await TrackPlayer.getActiveTrack();
            if (currentTrack) {
                const surahNumber = parseInt(currentTrack.id.replace('surah-', ''));
                setActiveSurahNumber(surahNumber);
                setActiveSurahName(currentTrack.title ?? null);
            }
        };
        setupAndSync();
    }, []);

    // ------------------------------------------------------------
    // Set switching state to false once playback starts or buffers
    // ------------------------------------------------------------
    useEffect(() => {
        if (isPlaying) {
            setIsSwitching(false);
        }
    }, [isPlaying]);

    // ------------------------------------------------------------
    // Play/Pause/Replay handler
    // ------------------------------------------------------------
    const handlePlayPauseReplay = useCallback(async (surah: Surah) => {
        const currentTrack = await TrackPlayer.getActiveTrack();
        if (currentTrack && activeSurahNumber === surah.number) {
            if (hasFinished) {
                // replay
                await TrackPlayer.seekTo(0);
                await TrackPlayer.play();
            } else if (isPlaying) {
                await TrackPlayer.pause();
            } else {
                await TrackPlayer.play();
            }
            return;
        }

        // New Surah → stop and load new track
        setActiveSurahNumber(surah.number);
        setActiveSurahName(surah.englishName);
        setIsSwitching(true);

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
    }, [activeSurahNumber, isPlaying, hasFinished]);

    // ------------------------------------------------------------
    // Stop handler
    // ------------------------------------------------------------
    const handleStop = useCallback(async (surah: Surah) => {
        if (activeSurahNumber === surah.number) {
            await TrackPlayer.stop();

            setActiveSurahNumber(null);
            setActiveSurahName(null);
            setIsSwitching(false);

            // Reset/Clear the foreground/live notification
            await TrackPlayer.reset();
        }
    }, [activeSurahNumber]);

    // ------------------------------------------------------------
    // Filter surahs locally — no extra API call
    // ------------------------------------------------------------
    const filteredSurahs = useMemo(() => {
        if (!searchQuery.trim()) return surahs;

        const q = searchQuery.toLowerCase().trim();

        return surahs.filter((s) =>
            s.englishName.toLowerCase().includes(q) || s.name.includes(q) || String(s.number).includes(q)
        );
    }, [surahs, searchQuery]);

    // ------------------------------------------------------------
    // Render each surah row
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
                isBuffering={isThisActive && isBuffering}
                hasFinished={isThisActive && hasFinished}
                currentProgress={isThisActive ? currentTime : 0}
                totalDuration={isThisActive ? duration : 0}
                onPlayPauseReplay={(surah) => handlePlayPauseReplay(surah)}
                onStop={(surah) => handleStop(surah)}
            />
        );
    }, [
        activeSurahNumber,
        isPlaying,
        isBuffering,
        hasFinished,
        currentTime,
        duration,
        theme,
        handlePlayPauseReplay,
        handleStop
    ]);

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
                message={error}
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