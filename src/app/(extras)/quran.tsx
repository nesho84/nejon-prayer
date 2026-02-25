import AppError from "@/components/AppError";
import AppLoading from "@/components/AppLoading";
import AppScreen from "@/components/AppScreen";
import SurahRow from "@/components/SurahRow";
import { fetchAllSurahs, getSurahAudioUrl, Surah } from "@/services/quranService";
import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function QuranScreen() {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const tr = useLanguageStore((state) => state.tr);

    // Local state
    const [surahs, setSurahs] = useState<Surah[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeSurah, setActiveSurah] = useState<number | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    // Audio player
    const player = useAudioPlayer(null, {
        // updateInterval: 1000,
        downloadFirst: true,
    });

    // Track buffering state and playback status
    const status = useAudioPlayerStatus(player);
    const isBuffering = status.isBuffering ?? false;

    // Create a ref for the TextInput
    const textInputRef = useRef<TextInput>(null);

    // ------------------------------------------------------------
    // Fetch all surahs on mount (one time, cached in state)
    // ------------------------------------------------------------
    useEffect(() => {
        fetchSurahs();
    }, []);

    // ------------------------------------------------------------
    // Load surahs from API
    // ------------------------------------------------------------
    const fetchSurahs = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await fetchAllSurahs();
            setSurahs(data);
        } catch (err) {
            console.error("❌ Failed to load surahs:", err);
            setError(tr.labels.quranSurahsError ?? "Failed to load surahs. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // ------------------------------------------------------------
    // reset active surah when playback finishes
    // ------------------------------------------------------------
    useEffect(() => {
        if (status.didJustFinish) {
            setActiveSurah(null);
        }
    }, [status.didJustFinish]);

    // ------------------------------------------------------------
    // Auto-play when new audio source is loaded
    // ------------------------------------------------------------
    useEffect(() => {
        if (!audioUrl) return;

        let mounted = true;

        const loadAndPlay = async () => {
            try {
                player.replace({ uri: audioUrl });
                if (mounted) {
                    player.play();
                }
            } catch (e) {
                console.error("Audio load error:", e);
            }
        };

        loadAndPlay();

        return () => {
            mounted = false;
        };
    }, [audioUrl, player]);

    // ------------------------------------------------------------
    // Play/Pause handler
    // ------------------------------------------------------------
    const handlePlayPause = useCallback((surahNumber: number) => {
        // Same surah → toggle
        if (activeSurah === surahNumber) {
            if (status.playing) {
                player.pause();
            } else {
                player.play();
            }
            return;
        }

        // Different surah → stop & load new
        player.pause();

        const newAudioUrl = getSurahAudioUrl(surahNumber);
        setActiveSurah(surahNumber);
        setAudioUrl(newAudioUrl);
    }, [activeSurah, status.playing, player]);

    // ------------------------------------------------------------
    // Filter surahs locally — no extra API call
    // ------------------------------------------------------------
    const filteredSurahs = useMemo(() => {
        if (!searchQuery.trim()) return surahs;

        const q = searchQuery.toLowerCase().trim();

        return surahs.filter(
            (s) =>
                s.englishName.toLowerCase().includes(q) ||
                s.name.includes(q) ||
                String(s.number).includes(q)
        );
    }, [surahs, searchQuery]);

    // ------------------------------------------------------------
    // Render each surah row
    // ------------------------------------------------------------
    const renderSurah = useCallback(({ item }: { item: Surah }) => {
        return (
            <SurahRow
                item={item}
                activeSurah={activeSurah}
                isPlaying={status.playing}
                isBuffering={isBuffering}
                theme={theme}
                onPlayPause={handlePlayPause}
            />
        );
    }, [activeSurah, status.playing, isBuffering, theme, handlePlayPause]);

    // Function to unfocus the TextInput
    const unfocusTextInput = () => {
        if (textInputRef.current) {
            textInputRef.current.blur(); // Call blur() to unfocus
        }
    };

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
                    renderItem={renderSurah}
                    contentContainerStyle={styles.surahList}
                    showsVerticalScrollIndicator={false}
                    removeClippedSubviews={true}
                    onScrollBeginDrag={unfocusTextInput}
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

    // Search
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

    // Surah List
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