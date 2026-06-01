import AppCard from "@/components/AppCard";
import AppLayout from "@/components/AppLayout";
import { globalStyles } from "@/constants/styles";
import { QUOTES_TR } from "@/constants/translations/quotes.tr";
import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { Feather } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import * as Clipboard from "expo-clipboard";
import { useCallback, useMemo, useState } from "react";
import { Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function QuotesScreen() {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const tr = useLanguageStore((state) => state.tr);
  const language = useLanguageStore((state) => state.language);

  // Local state
  const [currentQuote, setCurrentQuote] = useState(1);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [sharedId, setSharedId] = useState<number | null>(null);

  // Safe area insets
  const insets = useSafeAreaInsets();

  // ------------------------------------------------------------
  // Quotes data
  // ------------------------------------------------------------
  const quotes = useMemo(() => {
    return QUOTES_TR[language as keyof typeof QUOTES_TR] ?? QUOTES_TR.en;
  }, [language]);

  // ------------------------------------------------------------
  // Progress tracking
  // ------------------------------------------------------------
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
  // Copy text (title)
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

  // ------------------------------------------------------------
  // Render quote item with actions
  // ------------------------------------------------------------
  const renderItem = useCallback(({ item, index }: { item: string; index: number }) => (
    <AppCard style={[styles.quoteCard, { backgroundColor: theme.card }]}>
      <Text style={[styles.quoteText, { color: theme.text2 }]}>{item}</Text>

      <View style={styles.actionsRow}>
        {/* Copy button */}
        <TouchableOpacity
          onPress={() => handleCopy(index, item)}
          style={[globalStyles.actionButton, { backgroundColor: theme.card2 }]}
        >
          <Feather name={copiedId === index ? "check" : "copy"} size={16} color={copiedId === index ? theme.success : theme.text2} />
          <Text style={[globalStyles.actionText, { color: copiedId === index ? theme.success : theme.text2 }]}>
            {copiedId === index ? tr.buttons.copied : tr.buttons.copy}
          </Text>
        </TouchableOpacity>
        {/* Share button */}
        <TouchableOpacity
          onPress={() => handleShare(index, item)}
          style={[globalStyles.actionButton, { backgroundColor: theme.card2 }]}
        >
          <Feather name={sharedId === index ? "check" : "share-2"} size={16} color={sharedId === index ? theme.success : theme.text2} />
          <Text style={[globalStyles.actionText, { color: sharedId === index ? theme.success : theme.text2 }]}>
            {sharedId === index ? tr.buttons.shared : tr.buttons.share}
          </Text>
        </TouchableOpacity>
      </View>
    </AppCard>
  ), [copiedId, sharedId, theme, tr]);

  // Main Content
  return (
    <AppLayout>

      {/* PROGRESS */}
      <View style={[globalStyles.progressWrapper, { backgroundColor: theme.statusbar, borderBottomColor: theme.divider2 }]}>
        <View style={[globalStyles.progressTrack, { backgroundColor: theme.border }]}>
          <View style={[globalStyles.progressFill, { backgroundColor: theme.accent2, width: `${(currentQuote / quotes.length) * 100}%` as any }]} />
        </View>
        <Text style={[styles.progressText, { color: theme.placeholder }]}>
          {currentQuote} / {quotes.length}
        </Text>
      </View>

      {/* QUOTES List */}
      <FlashList
        data={quotes}
        keyExtractor={(_, idx) => String(idx)}
        ListHeaderComponent={
          // HEADER
          <AppCard style={[styles.headerCard, { backgroundColor: theme.card, borderColor: theme.accent2 }]}>
            <Text style={globalStyles.headerIcon}>📜</Text>
            <Text style={[globalStyles.headerTitle, { color: theme.text }]}>{tr.labels.quotes}</Text>
            <Text style={[globalStyles.headerSubtitle, { color: theme.placeholder }]}>{tr.labels.quotesDesc}</Text>
          </AppCard>
        }
        renderItem={renderItem}
        ListFooterComponent={
          // FOOTER
          <AppCard style={[styles.footerCard, { backgroundColor: theme.card, borderLeftColor: theme.placeholder }]}>
            <Text style={[styles.footerText, { color: theme.placeholder }]}>
              {tr.labels.quotesFooter}
            </Text>
          </AppCard>
        }
        contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
      />

    </AppLayout>
  );
}

const styles = StyleSheet.create({
  // Progress indicator
  progressText: {
    fontSize: 12,
    fontWeight: "600",
    minWidth: 40,
    textAlign: "right",
  },

  // Header card
  headerCard: {
    alignItems: "center",
    paddingVertical: 22,
    paddingHorizontal: 16,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    marginHorizontal: 8,
    marginBottom: 10,
  },
  // Quote cards
  quoteCard: {
    padding: 16,
    marginHorizontal: 8,
    marginBottom: 10,
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

  // Footer card
  footerCard: {
    padding: 22,
    borderLeftWidth: 4,
    marginHorizontal: 8,
    marginBottom: 10,
  },
  footerText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "400",
    fontStyle: "italic",
    textAlign: "justify",
  },
});