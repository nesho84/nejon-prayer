import { useState } from "react";
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Share } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useThemeContext } from "@/context/ThemeContext";
import useTranslation from "@/hooks/useTranslation";
import { Feather } from "@expo/vector-icons";
import AppFullScreen from "@/components/AppFullScreen";
import AppCard from "@/components/AppCard";

export default function RamadanScreen() {
    const { theme } = useThemeContext();
    const { tr } = useTranslation();

    // Add state to track both actions
    const [copiedId, setCopiedId] = useState(null);
    const [sharedId, setSharedId] = useState(null);

    const sections = [
        { id: 1, icon: "⭐", title: tr("ramazani.title1"), desc: tr("ramazani.desc1"), },
        { id: 2, icon: "⚠️", title: tr("ramazani.title2"), desc: tr("ramazani.desc2"), },
        { id: 3, icon: "💰", title: tr("ramazani.title3"), desc: tr("ramazani.desc3"), },
        { id: 4, icon: "🍽️", title: tr("ramazani.title4"), desc: tr("ramazani.desc4"), },
        { id: 5, icon: "🕌", title: tr("ramazani.title5"), desc: tr("ramazani.desc5"), },
        { id: 6, icon: "💝", title: tr("ramazani.title6"), desc: tr("ramazani.desc6"), },
        { id: 7, icon: "⏰", title: tr("ramazani.title7"), desc: tr("ramazani.desc7"), },
        { id: 8, icon: "📖", title: tr("ramazani.title8"), desc: tr("ramazani.desc8"), },
        { id: 9, icon: "🗣️", title: tr("ramazani.title9"), desc: tr("ramazani.desc9"), },
        { id: 10, icon: "✨", title: tr("ramazani.title10"), desc: tr("ramazani.desc10"), },
        { id: 11, icon: "🌙", title: tr("ramazani.title11"), desc: tr("ramazani.desc11"), },
        { id: 12, icon: "⭐", title: tr("ramazani.title12"), desc: tr("ramazani.desc12"), },
        { id: 13, icon: "🌅", title: tr("ramazani.title13"), desc: tr("ramazani.desc13"), },
        { id: 14, icon: "🌆", title: tr("ramazani.title14"), desc: tr("ramazani.desc14"), },
        { id: 15, icon: "☪️", title: tr("ramazani.title15"), desc: tr("ramazani.desc15"), },
    ];

    // ------------------------------------------------------------
    // Share text cross-platform
    // ------------------------------------------------------------
    const handleShare = async (id, title, message) => {
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
                setTimeout(() => {
                    setSharedId(null);
                }, 10000);
            }
        } catch (error) {
            console.error("Share failed:", error);
        }
    };

    // ------------------------------------------------------------
    // Copy text (title + message)
    // ------------------------------------------------------------
    const handleCopy = async (id, title, message) => {
        try {
            const textToCopy = `${title}\n\n${message}`;
            await Clipboard.setStringAsync(textToCopy);

            setCopiedId(id);
            setTimeout(() => {
                setCopiedId(null);
            }, 2000);
        } catch (error) {
            console.error("❌ Copy failed:", error);
        }
    };

    return (
        <AppFullScreen>
            <ScrollView
                style={[styles.scrollContainer, { backgroundColor: theme.bg }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >

                {/* HEADER */}
                <AppCard style={[styles.headerCard, { backgroundColor: theme.card, borderColor: theme.accent }]}>
                    <Text style={[styles.headerIcon]}>🌙</Text>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>
                        {tr("ramazani.headerTitle")}
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: theme.placeholder }]}>
                        {tr("ramazani.headerSubtitle")}
                    </Text>
                </AppCard>

                {/* SECTIONS */}
                {sections.map((item) => (
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
                                onPress={() => handleCopy(item.id, item.title, item.text)}
                                style={[styles.actionButton, { backgroundColor: theme.bg2 }]}
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
                                    {copiedId === item.id ? tr("buttons.copied") : tr("buttons.copy")}
                                </Text>
                            </TouchableOpacity>

                            {/* Share button */}
                            <TouchableOpacity
                                onPress={() => handleShare(item.id, item.title, item.text)}
                                style={[styles.actionButton, { backgroundColor: theme.bg2 }]}
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
                                    {sharedId === item.id ? tr("buttons.shared") : tr("buttons.share")}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </AppCard>
                ))}

            </ScrollView>
        </AppFullScreen>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 24,
        gap: 16,
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