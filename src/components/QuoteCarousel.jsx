import { useState, useMemo, useRef } from "react";
import { FlatList, Text, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "@/context/ThemeContext";
import { getDailyQuote } from "@/utils/dailyQuote";

const MAX_QUOTES = 5;
const PEEK = 12; // small visible edge of next/previous card
const SPACING = 8; // space between cards

export default function QuoteCarousel({ language }) {
    const { theme } = useThemeContext();

    const [activeIndex, setActiveIndex] = useState(0);
    const [containerWidth, setContainerWidth] = useState(null);

    const flatListRef = useRef(null);

    // ------------------------------------------------------------
    // Generate random quotes
    // ------------------------------------------------------------
    const quotes = useMemo(() => {
        const arr = [];
        const usedQuotes = new Set();

        while (arr.length < MAX_QUOTES) {
            const quote = getDailyQuote(language, { random: true });
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
    const handleScroll = (ev) => {
        const offsetX = ev.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / (containerWidth - PEEK * 2 + SPACING));
        setActiveIndex(index);
    };

    // ------------------------------------------------------------
    // Create Quote Component for the Flatlist
    // ------------------------------------------------------------
    const renderQuoteCard = ({ item: quote }) => (
        <View style={{ width: containerWidth - PEEK * 2, marginHorizontal: SPACING / 2 }}>
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
        return <View onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)} />;
    }

    return (
        <>
            {/* Quote Carousel */}
            <FlatList
                ref={flatListRef}
                data={quotes}
                renderItem={renderQuoteCard}
                keyExtractor={(_, idx) => idx.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onMomentumScrollEnd={handleScroll}
                decelerationRate="fast"
                snapToInterval={containerWidth - PEEK * 2 + SPACING}
                snapToAlignment="start"
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
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
    },
    decorativeLine: {
        height: 1,
        flex: 1,
        opacity: 0.3,
    },

    quoteText: {
        fontSize: 14,
        lineHeight: 23,
        textAlign: 'center',
        fontStyle: 'italic',
        opacity: 0.75,
        marginTop: 6,
        marginBottom: 8,
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
