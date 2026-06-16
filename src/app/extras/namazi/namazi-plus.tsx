import AppCard from "@/components/AppCard";
import AppLayout from "@/components/AppLayout";
import { globalStyles } from "@/constants/styles";
import { NAMAZI_PLUS_TR, NamaziPlusContent } from "@/constants/translations/namazi-plus.tr";
import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ItemType {
  key: string;
  prayer: NamaziPlusContent;
}

export default function NamaziPlusScreen() {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const language = useLanguageStore((state) => state.language);
  const namaziPlusTr = NAMAZI_PLUS_TR[language] ?? NAMAZI_PLUS_TR.sq;

  // Local state
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [currentItem, setCurrentItem] = useState(1);

  // Safe area insets
  const insets = useSafeAreaInsets();
  const topInset = 12;
  const bottomInset = insets.bottom + 12;

  // ------------------------------------------------------------
  // Items data
  // ------------------------------------------------------------
  const ITEMS: ItemType[] = useMemo(() => {
    return Object.entries(namaziPlusTr.prayers).map(([key, prayer]) => ({
      key,
      prayer,
    }));
  }, [namaziPlusTr]);

  // ------------------------------------------------------------
  // Progress tracking
  // ------------------------------------------------------------
  const handleScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number }; contentSize: { height: number }; layoutMeasurement: { height: number } } }) => {
    const { contentOffset: { y }, contentSize: { height: contentH }, layoutMeasurement: { height: layoutH } } = e.nativeEvent;
    const maxScroll = contentH - layoutH;
    if (maxScroll <= 0) return;
    const s = Math.min(ITEMS.length, Math.max(1, Math.ceil((y / maxScroll) * ITEMS.length)));
    setCurrentItem(s);
  }, [ITEMS.length]);

  // ------------------------------------------------------------
  // Toggle accordion
  // ------------------------------------------------------------
  const handleToggle = useCallback((key: string) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  }, []);

  // ------------------------------------------------------------
  // Render field row
  // ------------------------------------------------------------
  const renderField = useCallback((label: string, value: string | number | undefined) => {
    if (!value) return null;
    return (
      <View style={styles.fieldRow}>
        <Text style={[styles.fieldLabel, { color: theme.accent2 }]}>{label}:</Text>
        <Text style={[styles.fieldValue, { color: theme.textSecondary }]}>{String(value)}</Text>
      </View>
    );
  }, [theme]);

  // ------------------------------------------------------------
  // Render item with accordion
  // ------------------------------------------------------------
  const renderItem = useCallback(({ item }: { item: ItemType }) => {
    const isExpanded = expandedKey === item.key;

    return (
      <AppCard style={[styles.itemCard, { backgroundColor: theme.card }]}>
        <Pressable
          onPress={() => handleToggle(item.key)}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          android_ripple={{ color: theme.overlayLight, borderless: false }}
        >
          <View style={styles.itemRow}>
            <View style={styles.itemContent}>
              <Text style={[styles.itemTitle, { color: theme.text2 }]}>{item.prayer.name}</Text>
              {!isExpanded && (
                <Text style={[styles.itemDesc, { color: theme.textMuted }]} numberOfLines={1}>
                  {item.prayer.description}
                </Text>
              )}
            </View>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={18}
              color={theme.text2}
            />
          </View>
        </Pressable>

        {isExpanded && (
          <View style={[styles.detailContainer, { borderTopColor: theme.divider2 }]}>
            {renderField(namaziPlusTr.fieldDesc, item.prayer.description)}
            {renderField(namaziPlusTr.fieldTime, item.prayer.time)}
            {renderField(namaziPlusTr.fieldRakats, item.prayer.rakats)}
            {renderField(namaziPlusTr.fieldMethod, item.prayer.method)}
            {renderField(namaziPlusTr.fieldForm, item.prayer.form)}
            {renderField(namaziPlusTr.fieldStatus, item.prayer.status)}
            {renderField(namaziPlusTr.fieldNotes, item.prayer.notes)}
          </View>
        )}
      </AppCard>
    );
  }, [expandedKey, theme, handleToggle, namaziPlusTr, renderField]);

  // Main Content
  return (
    <AppLayout>

      {/* PROGRESS */}
      <View style={[globalStyles.progressWrapper, { backgroundColor: theme.statusbar, borderBottomColor: theme.divider2 }]}>
        <View style={[globalStyles.progressTrack, { backgroundColor: theme.border }]}>
          <View style={[globalStyles.progressFill, { backgroundColor: theme.islamicGreen, width: `${(currentItem / ITEMS.length) * 100}%` as any }]} />
        </View>
        <Text style={[styles.progressText, { color: theme.placeholder }]}>
          {currentItem} / {ITEMS.length}
        </Text>
      </View>

      {/* ITEMS List */}
      <FlashList
        data={ITEMS}
        keyExtractor={(item) => String(item.key)}
        ListHeaderComponent={
          // HEADER
          <AppCard style={[globalStyles.headerCard, { backgroundColor: theme.card, borderColor: theme.islamicGreen }]}>
            <Text style={globalStyles.headerIcon}>🕌</Text>
            <Text style={[globalStyles.headerTitle, { color: theme.text }]}>{namaziPlusTr.headerTitle}</Text>
            <Text style={[globalStyles.headerSubtitle, { color: theme.placeholder }]}>{namaziPlusTr.headerSubtitle}</Text>
          </AppCard>
        }
        renderItem={renderItem}
        ListFooterComponent={
          // FOOTER
          <AppCard style={[styles.footerCard, { backgroundColor: theme.card, borderLeftColor: theme.placeholder }]}>
            <Text style={[styles.footerText, { color: theme.placeholder }]}>
              {namaziPlusTr.footerText}
            </Text>
          </AppCard>
        }
        contentContainerStyle={{ paddingTop: topInset, paddingBottom: bottomInset }}
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

  // Item cards
  itemCard: {
    marginHorizontal: 8,
    marginBottom: 10,
    overflow: "hidden",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 10,
  },
  itemContent: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  itemDesc: {
    fontSize: 13,
    fontStyle: "italic",
  },

  // Detail rows
  detailContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  fieldRow: {
    gap: 2,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    fontStyle: "italic",
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  fieldValue: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400",
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
