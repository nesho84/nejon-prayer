import { QUOTES_TR } from "@/constants/translations/quotes.tr";
import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { Language } from "@/types/language.types";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, AppStateStatus, FlatList, LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, Text, View } from "react-native";

interface Props {
    refreshKey?: number; // Optional (e.g., on pull-to-refresh)
}

// Constants for carousel behavior and appearance
const MAX_QUOTES = 7; // max quotes to show in carousel
const INSET = 12; // inset from container edges
const SPACING = 8; // space between cards
const AUTO_SCROLL_INTERVAL = 15_000; // 15 seconds

// ------------------------------------------------------------
// Returns a quote for a given language (random or daily)
// ------------------------------------------------------------
const getDailyQuote = (language: Language = "en", random: boolean = false): string => {
    const messages = QUOTES_TR[language] || QUOTES_TR["en"];
    if (random) {
        return messages[Math.floor(Math.random() * messages.length)];
    }
    // Stable per day
    return messages[new Date().getDate() % messages.length];
};

const QuotesCarouselCard = React.memo(({ refreshKey }: Props) => {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const language = useLanguageStore((state) => state.language);

    // Local state
    const [activeIndex, setActiveIndex] = useState(0);
    const [containerWidth, setContainerWidth] = useState<number | null>(null);
    const [cardHeight, setCardHeight] = useState(0);

    // Refs
    const flatListRef = useRef<FlatList>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const activeIndexRef = useRef(0);
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);

    // Calculate item width based on container width and spacing
    const itemWidth = containerWidth !== null ? containerWidth - INSET * 2 : 0;

    // ------------------------------------------------------------
    // Generate random quotes
    // ------------------------------------------------------------
    const quotes = useMemo(() => {
        const messages = QUOTES_TR[language] || QUOTES_TR['en'];
        const limit = Math.min(MAX_QUOTES, messages.length);
        const arr: string[] = [];
        const usedQuotes = new Set<string>();

        while (arr.length < limit) {
            const quote = getDailyQuote(language, true);
            if (!usedQuotes.has(quote)) {
                usedQuotes.add(quote);
                arr.push(quote);
            }
        }

        return arr;
    }, [refreshKey, language]);

    // ------------------------------------------------------------
    // Scroll to index
    // ------------------------------------------------------------
    const scrollToIndex = useCallback((index: number) => {
        flatListRef.current?.scrollToIndex({ index, animated: true });
        activeIndexRef.current = index;
        setActiveIndex(index);
    }, []);

    // ------------------------------------------------------------
    // Start auto-scroll interval
    // ------------------------------------------------------------
    const startInterval = useCallback(() => {
        if (intervalRef.current) return;
        intervalRef.current = setInterval(() => {
            const next = (activeIndexRef.current + 1) % quotes.length;
            scrollToIndex(next);
        }, AUTO_SCROLL_INTERVAL);
    }, [scrollToIndex, quotes.length]);

    // ------------------------------------------------------------
    // Stop auto-scroll interval
    // ------------------------------------------------------------
    const stopInterval = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    // ------------------------------------------------------------
    // Start/stop interval on mount/unmount and AppState changes
    // ------------------------------------------------------------
    useEffect(() => {
        const sub = AppState.addEventListener("change", (nextState: AppStateStatus) => {
            const wasActive = appStateRef.current === "active";
            const isActive = nextState === "active";
            appStateRef.current = nextState;
            if (!wasActive && isActive) startInterval();
            else if (wasActive && !isActive) stopInterval();
        });

        startInterval();

        return () => {
            stopInterval();
            sub.remove();
        };
    }, [startInterval, stopInterval]);

    // ------------------------------------------------------------
    // Reset scroll position when language changes or quotes are refreshed
    // ------------------------------------------------------------
    useEffect(() => {
        scrollToIndex(0);
    }, [scrollToIndex, refreshKey, language]);

    // ------------------------------------------------------------
    // Re-scroll to current index on rotation (containerWidth change)
    // ------------------------------------------------------------
    useEffect(() => {
        if (containerWidth !== null) {
            scrollToIndex(activeIndexRef.current);
        }
    }, [containerWidth, scrollToIndex]);

    // ------------------------------------------------------------
    // Handle horizontal scrolling
    // ------------------------------------------------------------
    const handleScroll = useCallback((ev: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = ev.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / (itemWidth + SPACING));
        activeIndexRef.current = index;
        setActiveIndex(index);
    }, [itemWidth]);

    // ------------------------------------------------------------
    // Reset interval on manual swipe so it doesn't cut off too soon
    // ------------------------------------------------------------
    const handleScrollBeginDrag = useCallback(() => {
        stopInterval();
        startInterval();
    }, [stopInterval, startInterval]);

    // ------------------------------------------------------------
    // Create Quote Component for the FlatList
    // ------------------------------------------------------------
    const renderQuoteCard = useCallback(({ item: quote }: { item: string }) => (
        <View style={{ width: itemWidth, marginHorizontal: SPACING / 2, height: cardHeight || undefined }}
            onLayout={(e) => {
                const h = e.nativeEvent.layout.height;
                setCardHeight(prev => h > prev ? h : prev);
            }}
        >
            {/* Header with decoration Line */}
            <View style={styles.header}>
                <View style={[styles.decorativeLine, { backgroundColor: theme.accent }]} />
                <Ionicons name="book-outline" size={17} color={theme.accent} />
                <View style={[styles.decorativeLine, { backgroundColor: theme.accent }]} />
            </View>

            {/* Quote Text */}
            <View style={styles.textContainer}>
                <Text style={[styles.quoteText, { color: theme.text2, opacity: 0.65 }]}>
                    {quote}
                </Text>
            </View>
        </View>
    ), [itemWidth, theme.accent, theme.text2]);

    return (
        <View style={[styles.container, { backgroundColor: theme.card }]}>

            <View onLayout={(e: LayoutChangeEvent) => setContainerWidth(e.nativeEvent.layout.width)}>
                {containerWidth !== null && (
                    <>
                        {/* Quote Carousel */}
                        <FlatList
                            ref={flatListRef}
                            data={quotes}
                            keyExtractor={(_, idx) => idx.toString()}
                            renderItem={renderQuoteCard}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            initialNumToRender={7}
                            maxToRenderPerBatch={7}
                            scrollEventThrottle={16}
                            snapToInterval={itemWidth + SPACING}
                            snapToAlignment="start"
                            decelerationRate="fast"
                            onMomentumScrollEnd={handleScroll}
                            onScrollBeginDrag={handleScrollBeginDrag}
                            getItemLayout={(_, idx) => ({
                                length: itemWidth,
                                offset: (itemWidth + SPACING) * idx,
                                index: idx,
                            })}
                        />

                        {/* Dots */}
                        <View style={styles.dotsContainer}>
                            {quotes.map((_, idx) => (
                                <View
                                    key={idx}
                                    style={[styles.dot, { backgroundColor: idx === activeIndex ? theme.accent : theme.accentLight }]}
                                />
                            ))}
                        </View>
                    </>
                )}
            </View>

        </View>
    );
});

export default QuotesCarouselCard;

const styles = StyleSheet.create({
    container: {
        paddingTop: 6,
        paddingBottom: 9,
        paddingHorizontal: 12,
        // Card Shadow
        borderRadius: 16,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
    },
    decorativeLine: {
        flex: 1,
        height: 1,
        opacity: 0.3,
    },

    textContainer: {
        flex: 1,
        justifyContent: "center",
        paddingTop: 3,
        paddingBottom: 6,
    },
    quoteText: {
        fontSize: 13,
        lineHeight: 18,
        fontStyle: "italic",
        textAlign: "center",
        opacity: 0.75,
    },

    dotsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 5,
    },
    dot: {
        width: 5.5,
        height: 5.5,
        borderRadius: 3,
    },
});
