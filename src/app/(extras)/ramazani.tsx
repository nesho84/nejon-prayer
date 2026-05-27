import AppCard from "@/components/AppCard";
import AppScreen from "@/components/AppScreen";
import { RAMAZANI_TRANSLATIONS } from "@/constants/translations/ramazani.tr";
import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface SectionType {
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
    const ramazaniTr = RAMAZANI_TRANSLATIONS[language] ?? RAMAZANI_TRANSLATIONS.en;

    // Local state - track actions
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [sharedId, setSharedId] = useState<number | null>(null);

    // ------------------------------------------------------------
    // Sections data
    // ------------------------------------------------------------
    const SECTIONS: SectionType[] = useMemo(() => {
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
    const [currentSection, setCurrentSection] = useState(1);
    const handleScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number }; contentSize: { height: number }; layoutMeasurement: { height: number } } }) => {
        const { contentOffset: { y }, contentSize: { height: contentH }, layoutMeasurement: { height: layoutH } } = e.nativeEvent;
        const maxScroll = contentH - layoutH;
        if (maxScroll <= 0) return;
        const section = Math.min(SECTIONS.length, Math.max(1, Math.ceil((y / maxScroll) * SECTIONS.length)));
        setCurrentSection(section);
    }, [SECTIONS.length]);

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

                // Reset shared state after timeout to allow re-sharing
                setTimeout(() => {
                    setSharedId(null);
                }, 10000);
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

            // Reset copied state after timeout to allow re-copying
            setTimeout(() => {
                setCopiedId(null);
            }, 2000);
        } catch (err) {
            console.error("❌ Copy failed:", err);
        }
    };

    return (
        <AppScreen>

            {/* PROGRESS */}
            <View style={[styles.progressWrapper, { backgroundColor: theme.statusbar, borderBottomColor: theme.divider2 }]}>
                <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
                    <View style={[styles.progressFill, { backgroundColor: theme.violet, width: `${(currentSection / SECTIONS.length) * 100}%` as any }]} />
                </View>
                <Text style={[styles.progressText, { color: theme.placeholder }]}>
                    {currentSection} / {SECTIONS.length}
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
                <AppCard style={[styles.headerCard, { backgroundColor: theme.card, borderColor: theme.violet }]}>
                    <Text style={[styles.headerIcon]}>🌙</Text>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>
                        {ramazaniTr.headerTitle}
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: theme.placeholder }]}>
                        {ramazaniTr.headerSubtitle}
                    </Text>
                </AppCard>

                {/* SECTIONS */}
                {SECTIONS.map((item) => (
                    <AppCard key={item.id} style={[styles.sectionCard, { backgroundColor: theme.card }]}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.iconText}>{item.icon}</Text>
                            <Text style={[styles.sectionTitle, { color: theme.text2 }]}>
                                {item.title}
                            </Text>
                        </View>
                        <Text style={[styles.sectionDesc, { color: theme.placeholder }]}>
                            {item.desc}
                        </Text>

                        {/* Action buttons */}
                        <View style={styles.actionsRow}>
                            {/* Copy button */}
                            <TouchableOpacity
                                onPress={() => handleCopy(item.id, item.title, item.desc)}
                                style={[styles.actionButton, { backgroundColor: theme.card2 }]}
                            >
                                <Feather
                                    name={copiedId === item.id ? "check" : "copy"}
                                    size={16}
                                    color={copiedId === item.id ? theme.success : theme.text2}
                                />
                                <Text style={[
                                    styles.actionText,
                                    { color: copiedId === item.id ? theme.success : theme.text2 }
                                ]}>
                                    {copiedId === item.id ? tr.buttons.copied : tr.buttons.copy}
                                </Text>
                            </TouchableOpacity>

                            {/* Share button */}
                            <TouchableOpacity
                                onPress={() => handleShare(item.id, item.title, item.desc)}
                                style={[styles.actionButton, { backgroundColor: theme.card2 }]}
                            >
                                <Feather
                                    name={sharedId === item.id ? "check" : "share-2"}
                                    size={16}
                                    color={sharedId === item.id ? theme.success : theme.text2}
                                />
                                <Text style={[
                                    styles.actionText,
                                    { color: sharedId === item.id ? theme.success : theme.text2 }
                                ]}>
                                    {sharedId === item.id ? tr.buttons.shared : tr.buttons.share}
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

    // Section cards
    sectionCard: {
        padding: 16,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
        gap: 8,
    },
    iconText: {
        fontSize: 16,
    },
    sectionTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: "600",
    },
    sectionDesc: {
        fontSize: 15,
        lineHeight: 20,
        fontWeight: "400",
        textAlign: "justify",
        marginBottom: 16,
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