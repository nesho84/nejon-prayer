import { QUOTES } from "@/constants/quotes";
import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { Language } from "@/types/language.types";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useRef, useState } from "react";
import { FlatList, LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, Text, View } from "react-native";

// Constants for carousel behavior and appearance
const MAX_QUOTES = 5;
const PEEK = 12; // small visible edge of next/previous card
const SPACING = 8; // space between cards

const QuotesCarouselCard = React.memo(() => {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const language = useLanguageStore((state) => state.language);

    // Local state
    const [activeIndex, setActiveIndex] = useState(0);
    const [containerWidth, setContainerWidth] = useState<number | null>(null);

    // Refs
    const flatListRef = useRef(null);

    // ------------------------------------------------------------
    // Returns today's dynamic daily Quote for a given language
    // ------------------------------------------------------------
    const getDailyQuote = (language: Language = "en", random: boolean = false): string => {
        const messages = QUOTES[language] || QUOTES["en"];
        if (random) {
            const randomIndex = Math.floor(Math.random() * messages.length);
            return messages[randomIndex];
        }
        // Stable per day
        const todayIndex = new Date().getDate();
        const index = todayIndex % messages.length;
        return messages[index];
    };

    // ------------------------------------------------------------
    // Generate random quotes
    // ------------------------------------------------------------
    const quotes = useMemo(() => {
        const arr = [];
        const usedQuotes = new Set<string>();

        while (arr.length < MAX_QUOTES) {
            const quote = getDailyQuote(language, true);
            if (!usedQuotes.has(quote)) {
                usedQuotes.add(quote);
                arr.push(quote);
            }
        }

        return arr;
    }, [language]);

    // ------------------------------------------------------------
    // Handle horizontal scrolling
    // ------------------------------------------------------------
    const handleScroll = (ev: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = ev.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / (containerWidth! - PEEK * 2 + SPACING));
        setActiveIndex(index);
    };

    // ------------------------------------------------------------
    // Create Quote Component for the Flatlist
    // ------------------------------------------------------------
    const renderQuoteCard = ({ item: quote }: { item: string }) => (
        <View style={{ width: containerWidth! - PEEK * 2, marginHorizontal: SPACING / 2 }}>
            {/* Header with decoration Line */}
            <View style={styles.header}>
                <View style={[styles.decorativeLine, { backgroundColor: theme.accent }]} />
                <Ionicons name="book-outline" size={18} color={theme.accent} />
                <View style={[styles.decorativeLine, { backgroundColor: theme.accent }]} />
            </View>
            {/* Quote Text */}
            <Text style={[styles.quoteText, { color: theme.text2 }]} adjustsFontSizeToFit>
                {quote}
            </Text>
        </View>
    );

    // Wait until layout is measured
    if (!containerWidth) {
        return <View onLayout={(e: LayoutChangeEvent) => setContainerWidth(e.nativeEvent.layout.width)} />;
    }

    return (
        <>
            {/* Quote Carousel */}
            <FlatList
                ref={flatListRef}
                data={quotes}
                renderItem={renderQuoteCard}
                keyExtractor={(_, idx) => idx.toString()}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                pagingEnabled={true}
                onMomentumScrollEnd={handleScroll}
                snapToInterval={containerWidth - PEEK * 2 + SPACING}
                snapToAlignment="start"
                decelerationRate="fast"
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
    );
});

export default QuotesCarouselCard;

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
    },
    decorativeLine: {
        flex: 1,
        height: 1,
        opacity: 0.3,
    },

    quoteText: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        fontStyle: 'italic',
        opacity: 0.75,
        marginTop: 4,
        marginBottom: 7,
    },

    dotsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
});
