import AppCard from "@/components/AppCard";
import AppLayout from "@/components/AppLayout";
import { globalStyles } from "@/constants/styles";
import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Href, router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SubMenuItem {
    href: Href;
    label: string;
}

interface MenuItem {
    id: number;
    type: 'internal' | 'external';
    href: Href;
    label: string;
    description: string;
    color: string;
    bg: string;
    icon: React.ReactNode;
    subItems?: SubMenuItem[];
}

export default function ExtrasTabScreen() {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const tr = useLanguageStore((state) => state.tr);

    // Safe area insets
    const insets = useSafeAreaInsets();

    // Local state
    const [expandedId, setExpandedId] = useState<number | null>(null);

    // Reset expanded item when leaving the screen
    useFocusEffect(
        useCallback(() => {
            return () => setExpandedId(null); // runs on blur (leaving the screen)
        }, [])
    );

    const FEATURES: MenuItem[] = [
        {
            id: 1,
            href: "/extras/abdesi",
            type: 'internal',
            label: tr.labels.abdes,
            description: tr.labels.abdesDesc || "Step by step ablution guide",
            color: theme.secondary,
            bg: `${theme.secondary}20`,
            icon: <MaterialCommunityIcons name="shimmer" size={32} color={theme.secondary} />
        },
        {
            id: 2,
            href: "/extras/namazi/namazi-guide",
            type: 'internal',
            label: tr.labels.namaz,
            description: tr.labels.namazDesc || "Mëso dhe praktiko Namazin",
            color: theme.islamicGreen,
            bg: `${theme.islamicGreen}20`,
            icon: <MaterialCommunityIcons name="mosque-outline" size={32} color={theme.islamicGreen} />,
            subItems: [
                { href: "/extras/namazi/namazi-guide", label: tr.labels.namazGuideItem || "Udhëzuesi i Namazit" },
                { href: "/extras/namazi/namazi-table", label: tr.labels.namazTableItem || "Tabela e Rekateve" },
                { href: "/extras/namazi/namazi-plus", label: tr.labels.namazPlusItem || "Namazet tjera" },
            ],
        },
        {
            id: 3,
            href: "/extras/tesbih",
            type: 'internal',
            label: tr.labels.tesbih,
            description: tr.labels.tesbihDesc || "Digital prayer beads counter",
            color: theme.pink,
            bg: `${theme.pink}20`,
            icon: <MaterialCommunityIcons name="counter" size={36} color={theme.pink} />,
        },
        {
            id: 4,
            href: "/extras/ramazani",
            type: 'internal',
            label: tr.labels.ramadan,
            description: tr.labels.ramadanDesc || "Digital prayer beads counter",
            color: theme.violet,
            bg: `${theme.violet}25`,
            icon: <Ionicons name="moon-outline" size={32} color={theme.violet} />
        },
        {
            id: 5,
            href: "/extras/quotes",
            type: 'internal',
            label: tr.labels.quotes,
            description: tr.labels.quotesDesc || "Daily inspiration from Quran & Hadith",
            color: theme.danger,
            bg: `${theme.danger}20`,
            icon: <MaterialCommunityIcons name="book-outline" size={32} color={theme.accent2} />
        },
        {
            id: 6,
            href: "/extras/about",
            type: 'internal',
            label: tr.labels.about,
            description: tr.labels.aboutDesc || "App information & credits",
            color: theme.primary,
            bg: `${theme.primary}17`,
            icon: <MaterialCommunityIcons name="information-outline" size={34} color={theme.primary} />
        },
    ];

    return (
        <AppLayout>
            <ScrollView
                style={[globalStyles.scrollContainer, { backgroundColor: theme.bg }]}
                contentContainerStyle={[
                    globalStyles.scrollContent,
                    { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }
                ]}
                showsVerticalScrollIndicator={false}
            >

                {/* Hero Header Section */}
                <AppCard style={styles.headerCard}>
                    <View style={[styles.headerIconContainer, { backgroundColor: "#f59e0b26" }]}>
                        <Ionicons name="apps" size={52} color={theme.accent} />
                    </View>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>
                        {tr.labels.extrasTitle || "Explore Features"}
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                        {tr.labels.extrasSubtitle || "Enhance your spiritual journey with these tools"}
                    </Text>
                </AppCard>

                {/* Feature List Card */}
                <AppCard style={styles.listCard}>
                    {FEATURES.map((item, index) => {

                        // Renders each item in the list, wrapped in the appropriate Pressable/Link based on type
                        const renderItem = (chevron: 'chevron-forward' | 'chevron-down' = 'chevron-forward') => (
                            <View style={styles.listItem}>
                                {/* Left: Icon */}
                                <View style={[styles.itemIconContainer, { backgroundColor: item.bg, borderColor: theme.divider2 }]}>
                                    {item.icon}
                                </View>

                                {/* Center: Item title and description below */}
                                <View style={styles.itemTextContainer}>
                                    <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>
                                        {item.label}
                                    </Text>
                                    <Text style={[styles.itemDescription, { color: theme.textSecondary }]} numberOfLines={2}>
                                        {item.description}
                                    </Text>
                                </View>

                                {/* Right: Chevron right */}
                                <Ionicons name={chevron} size={20} color={theme.text2} />
                            </View>
                        );

                        return (
                            <View key={item.id}>
                                {/* Internal Link */}
                                {item.type === 'internal' && !item.subItems && (
                                    <Pressable
                                        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                                        android_ripple={{ color: theme.overlayLight, borderless: false }}
                                        onPress={() => router.navigate(item.href)}
                                    >
                                        {renderItem()}
                                    </Pressable>
                                )}

                                {/* External Link */}
                                {item.type === 'external' && (
                                    <Pressable
                                        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                                        android_ripple={{ color: theme.overlayLight, borderless: false }}
                                        onPress={() => Linking.openURL(item.href as string)}
                                    >
                                        {renderItem()}
                                    </Pressable>
                                )}

                                {/* Sub-items accordion */}
                                {item.subItems && (
                                    <>
                                        <Pressable
                                            style={({ pressed }) => [{ opacity: pressed ? 0.65 : 1 }]}
                                            android_ripple={{ color: theme.overlayLight, borderless: false }}
                                            onPress={() => setExpandedId((prev) => (prev === item.id ? null : item.id))}
                                        >
                                            {renderItem(expandedId === item.id ? 'chevron-down' : 'chevron-forward')}
                                        </Pressable>
                                        {expandedId === item.id && (
                                            <View style={[styles.subContainer, { opacity: 0.65 }]}>
                                                <View style={[styles.itemDivider, { backgroundColor: theme.divider2 }]} />
                                                {item.subItems.map((sub, subIndex) => (
                                                    <View key={subIndex}>
                                                        {subIndex > 0 && <View style={[styles.subItemDivider, { backgroundColor: theme.divider2 }]} />}
                                                        <Pressable
                                                            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                                                            android_ripple={{ color: theme.overlayLight, borderless: false }}
                                                            onPress={() => router.navigate(sub.href)}
                                                        >
                                                            <View style={styles.subRow}>
                                                                <Ionicons name="return-down-forward" size={14} color={theme.textSecondary} />
                                                                <Text style={[styles.subLabel, { color: theme.text2 }]} numberOfLines={1}>
                                                                    {sub.label}
                                                                </Text>
                                                                <Ionicons name="chevron-forward" size={18} color={theme.text2} />
                                                            </View>
                                                        </Pressable>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </>
                                )}

                                {index < FEATURES.length - 1 && (
                                    <View style={[styles.itemDivider, { backgroundColor: theme.divider2 }]} />
                                )}
                            </View>
                        );
                    })}
                </AppCard>

            </ScrollView>
        </AppLayout>
    );
}

const styles = StyleSheet.create({
    // Header Hero Section
    headerCard: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 32,
    },
    headerIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 21,
        textAlign: 'center',
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: -0.3,
    },
    headerSubtitle: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        opacity: 0.7,
    },

    // List Card
    listCard: {
        flex: 1,
        paddingVertical: 8,
        overflow: 'hidden',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        gap: 14,
    },
    itemIconContainer: {
        width: 56,
        height: 56,
        borderWidth: 1,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemTextContainer: {
        flex: 1,
        gap: 4,
    },
    itemTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    itemDescription: {
        fontSize: 14,
        lineHeight: 20,
        opacity: 0.7,
    },
    itemDivider: {
        height: 2,
        marginHorizontal: 18,
    },
    subContainer: {
        overflow: 'hidden',
    },
    subItemDivider: {
        height: 0.5,
        marginHorizontal: 16,
    },
    subRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 14,
        paddingLeft: 62,
        paddingRight: 20,
    },
    subLabel: {
        fontSize: 15,
        flex: 1,
    },
});