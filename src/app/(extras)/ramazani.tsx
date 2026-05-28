import AppCard from "@/components/AppCard";
import AppScreen from "@/components/AppScreen";
import { globalStyles } from "@/constants/styles";
import { RAMAZANI_TR } from "@/constants/translations/ramazani.tr";
import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { Feather } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import * as Clipboard from "expo-clipboard";
import { useCallback, useMemo, useState } from "react";
import { Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ItemType {
    id: number;
    icon: string;
    title: string;
    desc: string;
}

export default function RamadanScreen() {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const tr = useLanguageStore((state) => state.tr);
    const language = useLanguageStore((state) => state.language);
    const ramazaniTr = RAMAZANI_TR[language] ?? RAMAZANI_TR.en;

    // Local state
    const [currentItem, setCurrentItem] = useState(1);
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [sharedId, setSharedId] = useState<number | null>(null);

    // ------------------------------------------------------------
    // Items data
    // ------------------------------------------------------------
    const ITEMS: ItemType[] = useMemo(() => {
        return [
            { id: 1, icon: "⭐", title: ramazaniTr.title1, desc: ramazaniTr.desc1, },
            { id: 2, icon: "⚠️", title: ramazaniTr.title2, desc: ramazaniTr.desc2, },
            { id: 3, icon: "💰", title: ramazaniTr.title3, desc: ramazaniTr.desc3, },
            { id: 4, icon: "🍽️", title: ramazaniTr.title4, desc: ramazaniTr.desc4, },
            { id: 5, icon: "🕌", title: ramazaniTr.title5, desc: ramazaniTr.desc5, },
            { id: 6, icon: "💝", title: ramazaniTr.title6, desc: ramazaniTr.desc6, },
            { id: 7, icon: "⏰", title: ramazaniTr.title7, desc: ramazaniTr.desc7, },
            { id: 8, icon: "📖", title: ramazaniTr.title8, desc: ramazaniTr.desc8, },
            { id: 9, icon: "🗣️", title: ramazaniTr.title9, desc: ramazaniTr.desc9, },
            { id: 10, icon: "✨", title: ramazaniTr.title10, desc: ramazaniTr.desc10, },
            { id: 11, icon: "🌙", title: ramazaniTr.title11, desc: ramazaniTr.desc11, },
            { id: 12, icon: "⭐", title: ramazaniTr.title12, desc: ramazaniTr.desc12, },
            { id: 13, icon: "🌅", title: ramazaniTr.title13, desc: ramazaniTr.desc13, },
            { id: 14, icon: "🌆", title: ramazaniTr.title14, desc: ramazaniTr.desc14, },
            { id: 15, icon: "☪️", title: ramazaniTr.title15, desc: ramazaniTr.desc15, },
        ];
    }, [ramazaniTr]);

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
    // Share text cross-platform
    // ------------------------------------------------------------
    const handleShare = async (id: number, title: string, message: string) => {
        try {
            const result = await Share.share(
                {
                    title: title,
                    message: `${title}\n\n${message}`,
                },
                {
                    dialogTitle: title,
                    subject: title,
                }
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
    const handleCopy = async (id: number, title: string, message: string) => {
        try {
            const textToCopy = `${title}\n\n${message}`;
            await Clipboard.setStringAsync(textToCopy);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error("❌ Copy failed:", err);
        }
    };

    // ------------------------------------------------------------
    // Render item with actions
    // ------------------------------------------------------------
    const renderItem = useCallback(({ item }: { item: ItemType }) => (
        <AppCard style={[styles.itemCard, { backgroundColor: theme.card }]}>
            <View style={styles.itemHeader}>
                <Text style={styles.itemHeaderIcon}>{item.icon}</Text>
                <Text style={[styles.itemHeaderTitle, { color: theme.text2 }]}>{item.title}</Text>
            </View>

            <Text style={[styles.itemDesc, { color: theme.textMuted }]}>{item.desc}</Text>

            <View style={styles.actionsRow}>
                {/* Copy button */}
                <TouchableOpacity
                    onPress={() => handleCopy(item.id, item.title, item.desc)}
                    style={[globalStyles.actionButton, { backgroundColor: theme.card2 }]}
                >
                    <Feather name={copiedId === item.id ? "check" : "copy"} size={16} color={copiedId === item.id ? theme.success : theme.text2} />
                    <Text style={[globalStyles.actionText, { color: copiedId === item.id ? theme.success : theme.text2 }]}>
                        {copiedId === item.id ? tr.buttons.copied : tr.buttons.copy}
                    </Text>
                </TouchableOpacity>
                {/* Share button */}
                <TouchableOpacity
                    onPress={() => handleShare(item.id, item.title, item.desc)}
                    style={[globalStyles.actionButton, { backgroundColor: theme.card2 }]}
                >
                    <Feather name={sharedId === item.id ? "check" : "share-2"} size={16} color={sharedId === item.id ? theme.success : theme.text2} />
                    <Text style={[globalStyles.actionText, { color: sharedId === item.id ? theme.success : theme.text2 }]}>
                        {sharedId === item.id ? tr.buttons.shared : tr.buttons.share}
                    </Text>
                </TouchableOpacity>
            </View>
        </AppCard>
    ), [copiedId, sharedId, theme, tr]);

    return (
        <AppScreen>

            {/* PROGRESS */}
            <View style={[globalStyles.progressWrapper, { backgroundColor: theme.statusbar, borderBottomColor: theme.divider2 }]}>
                <View style={[globalStyles.progressTrack, { backgroundColor: theme.border }]}>
                    <View style={[globalStyles.progressFill, { backgroundColor: theme.violet, width: `${(currentItem / ITEMS.length) * 100}%` as any }]} />
                </View>
                <Text style={[styles.progressText, { color: theme.placeholder }]}>
                    {currentItem} / {ITEMS.length}
                </Text>
            </View>

            {/* ITEMS List */}
            <FlashList
                data={ITEMS}
                keyExtractor={(item) => String(item.id)}
                ListHeaderComponent={
                    // HEADER
                    <AppCard style={[styles.headerCard, { backgroundColor: theme.card, borderColor: theme.violet }]}>
                        <Text style={globalStyles.headerIcon}>🌙</Text>
                        <Text style={[globalStyles.headerTitle, { color: theme.text }]}>{ramazaniTr.headerTitle}</Text>
                        <Text style={[globalStyles.headerSubtitle, { color: theme.placeholder }]}>{ramazaniTr.headerSubtitle}</Text>
                    </AppCard>
                }
                renderItem={renderItem}
                contentContainerStyle={styles.itemsList}
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
            />

        </AppScreen>
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
        marginTop: 12,
        marginBottom: 10,
    },
    // Section cards
    itemsList: {
        paddingBottom: 24,
    },
    itemCard: {
        padding: 16,
        marginHorizontal: 8,
        marginBottom: 10,
        gap: 10,
    },
    itemHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    itemHeaderIcon: {
        fontSize: 16,
    },
    itemHeaderTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: "600",
    },
    itemDesc: {
        fontSize: 15,
        lineHeight: 22,
        fontWeight: "400",
        textAlign: "justify",
    },

    // Action Buttons
    actionsRow: {
        marginTop: 6,
        flexDirection: "row",
        gap: 8,
    },
});