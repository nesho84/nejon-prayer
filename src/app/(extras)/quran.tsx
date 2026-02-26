import AppError from "@/components/AppError";
import AppLoading from "@/components/AppLoading";
import AppScreen from "@/components/AppScreen";
import QuranRow from "@/components/QuranRow";
import { useQuranPlayer } from "@/hooks/useQuranPlayer";
import { fetchAllSurahs, Surah } from "@/services/quranService";
import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function QuranScreen() {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const tr = useLanguageStore((state) => state.tr);

    // Local state
    const [surahs, setSurahs] = useState<Surah[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Audio player hook
    const {
        activeSound,
        isPlaying,
        isBuffering,
        hasFinished,
        currentTime,
        duration,
        handlePlayPause
    } = useQuranPlayer();

    // Create a ref for the TextInput
    const isFetchMountedRef = useRef(true);
    const textInputRef = useRef<TextInput>(null);

    // ------------------------------------------------------------
    // Fetch all surahs on mount (one time, cached in state)
    // ------------------------------------------------------------
    useEffect(() => {
        fetchSurahs();

        return () => {
            isFetchMountedRef.current = false;
        };
    }, []);

    // ------------------------------------------------------------
    // Load surahs from API
    // ------------------------------------------------------------
    const fetchSurahs = async () => {
        setIsLoading(true);
        try {
            setError(null);
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
            setIsLoading(false);
        }
    };

    // ------------------------------------------------------------
    // Filter surahs locally — no extra API call
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
    // Render each surah row
    // ------------------------------------------------------------
    const renderSurah = useCallback(({ item }: { item: Surah }) => {
        const isThisActive = activeSound === item.number;

        return (
            <QuranRow
                item={item}
                theme={theme}
                activeSound={activeSound}
                // Only active row receives changing values (Important optimization for FlatList)
                isPlaying={isThisActive && isPlaying}
                isBuffering={isThisActive && isBuffering}
                hasFinished={isThisActive && hasFinished}
                currentProgress={isThisActive ? currentTime : 0}
                totalDuration={isThisActive ? duration : 0}
                onPlayPause={handlePlayPause}
            />
        );
    }, [activeSound, isPlaying, isBuffering, hasFinished, currentTime, duration, theme, handlePlayPause]);

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
                    initialNumToRender={15}
                    maxToRenderPerBatch={10}
                    windowSize={7}
                    removeClippedSubviews={true}
                    onScrollBeginDrag={() => textInputRef.current?.blur()}
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