import AppCard from "@/components/AppCard";
import AppScreen from "@/components/AppScreen";
import { QUOTES } from "@/constants/translations/islamicQuotes.tr";
import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function QuotesScreen() {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const tr = useLanguageStore((state) => state.tr);
  const language = useLanguageStore((state) => state.language);

  const quotes = useMemo(() => QUOTES[language as keyof typeof QUOTES] ?? QUOTES.en, [language]);

  // Local state - track actions
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [sharedId, setSharedId] = useState<number | null>(null);

  // ------------------------------------------------------------
  // Progress tracking
  // ------------------------------------------------------------
  const [currentQuote, setCurrentQuote] = useState(1);
  const handleScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number }; contentSize: { height: number }; layoutMeasurement: { height: number } } }) => {
    const { contentOffset: { y }, contentSize: { height: contentH }, layoutMeasurement: { height: layoutH } } = e.nativeEvent;
    const maxScroll = contentH - layoutH;
    if (maxScroll <= 0) return;
    const q = Math.min(quotes.length, Math.max(1, Math.ceil((y / maxScroll) * quotes.length)));
    setCurrentQuote(q);
  }, [quotes.length]);

  // ------------------------------------------------------------
  // Share text cross-platform
  // ------------------------------------------------------------
  const handleShare = async (id: number, quote: string) => {
    try {
      const result = await Share.share(
        { message: quote },
        { dialogTitle: tr.labels.quotes }
      );
      if (result.action === Share.sharedAction) {
        setSharedId(id);
        setTimeout(() => setSharedId(null), 10000);
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  // ------------------------------------------------------------
  // Copy text (title + message)
  // ------------------------------------------------------------
  const handleCopy = async (id: number, quote: string) => {
    try {
      await Clipboard.setStringAsync(quote);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  return (
    <AppScreen>

      {/* PROGRESS */}
      <View style={[styles.progressWrapper, { backgroundColor: theme.statusbar, borderBottomColor: theme.divider2 }]}>
        <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
          <View style={[styles.progressFill, { backgroundColor: theme.danger, width: `${(currentQuote / quotes.length) * 100}%` as any }]} />
        </View>
        <Text style={[styles.progressText, { color: theme.placeholder }]}>
          {currentQuote} / {quotes.length}
        </Text>
      </View>

      <ScrollView
        style={[styles.scrollContainer, { backgroundColor: theme.bg }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >

        {/* HEADER */}
        <AppCard style={[styles.headerCard, { backgroundColor: theme.card, borderColor: theme.danger }]}>
          <Text style={styles.headerIcon}>📜</Text>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {tr.labels.quotes}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.placeholder }]}>
            {tr.labels.quotesDesc}
          </Text>
        </AppCard>

        {/* QUOTES */}
        {quotes.map((quote, index) => (
          <AppCard key={index} style={[styles.quoteCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.quoteText, { color: theme.text2 }]}>
              {quote}
            </Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                onPress={() => handleCopy(index, quote)}
                style={[styles.actionButton, { backgroundColor: theme.card2 }]}
              >
                <Feather
                  name={copiedId === index ? "check" : "copy"}
                  size={16}
                  color={copiedId === index ? theme.success : theme.text2}
                />
                <Text style={[styles.actionText, { color: copiedId === index ? theme.success : theme.text2 }]}>
                  {copiedId === index ? tr.buttons.copied : tr.buttons.copy}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleShare(index, quote)}
                style={[styles.actionButton, { backgroundColor: theme.card2 }]}
              >
                <Feather
                  name={sharedId === index ? "check" : "share-2"}
                  size={16}
                  color={sharedId === index ? theme.success : theme.text2}
                />
                <Text style={[styles.actionText, { color: sharedId === index ? theme.success : theme.text2 }]}>
                  {sharedId === index ? tr.buttons.shared : tr.buttons.share}
                </Text>
              </TouchableOpacity>
            </View>
          </AppCard>
        ))}

      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 8,
    gap: 10,
  },

  // Progress indicator
  progressWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    opacity: 0.5,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },

  // Header card
  headerCard: {
    alignItems: "center",
    paddingVertical: 22,
    paddingHorizontal: 16,
    borderLeftWidth: 2,
    borderRightWidth: 2,
  },
  headerIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: "700",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: "400",
    textAlign: "center",
  },

  // Quote cards
  quoteCard: {
    padding: 16,
    gap: 16,
  },
  quoteText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400",
    textAlign: "justify",
  },

  // Action Buttons
  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
