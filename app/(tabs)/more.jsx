import React from "react";
import { StyleSheet, View, Text, ScrollView, Pressable } from "react-native";
import { Ionicons, MaterialCommunityIcons as McIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useThemeContext } from "@/contexts/ThemeContext";
import useTranslation from "@/hooks/useTranslation";
import AppScreen from "@/components/AppScreen";

export default function ExtrasScreen() {
    const { theme } = useThemeContext();
    const { tr } = useTranslation();

    const features = [
        { href: "extras/namazi", label: tr("labels.namaz"), color: "#3b82f6", icon: <Ionicons name="timer-outline" size={32} color="#3b82f6" /> },
        { href: "extras/abdesi", label: tr("labels.abdes"), color: "#06b6d4", icon: <Ionicons name="water-outline" size={30} color="#06b6d4" /> },
        { href: "extras/tesbih", label: tr("labels.tesbih"), color: "#8b5cf6", icon: <McIcons name="counter" size={34} color="#8b5cf6" /> },
        { href: "extras/about", label: tr("labels.about"), color: "#f59e0b", icon: <McIcons name="information-outline" size={32} color="#f59e0b" /> },
    ];

    return (
        <AppScreen>
            <ScrollView
                style={[styles.scrollContainer, { backgroundColor: theme.bg }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                        {tr("labels.extrasTitle")}
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.text2 }]}>
                        {tr("labels.extrasSubtitle")}
                    </Text>
                </View>

                {/* Optional Divider */}
                <View style={[styles.divider, { backgroundColor: theme.text }]} />

                {/* Feature Cards */}
                <View style={styles.grid}>
                    {features.map((item) => (
                        <Link key={item.href} href={item.href} asChild>
                            <Pressable style={styles.cardWrapper}>
                                {({ pressed }) => (
                                    <View
                                        style={[
                                            styles.moreCard,
                                            { backgroundColor: theme.card },
                                            pressed && styles.cardPressed,
                                        ]}
                                    >
                                        <View style={[styles.iconContainer, { backgroundColor: item.color + "15" }]}>
                                            {item.icon}
                                        </View>
                                        <Text style={[styles.label, { color: theme.text }]} numberOfLines={1}>
                                            {item.label}
                                        </Text>
                                    </View>
                                )}
                            </Pressable>
                        </Link>
                    ))}
                </View>
            </ScrollView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 32,
        paddingBottom: 24,
        gap: 16,
    },

    // Header
    header: {
        paddingLeft: 3,
    },
    title: {
        fontSize: 30,
        fontWeight: "700",
        marginBottom: 3,
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 14,
        paddingLeft: 1,
        opacity: 0.65,
    },
    divider: {
        height: 1,
        marginHorizontal: 3,
        marginTop: -2,
        marginBottom: 8,
        opacity: 0.08,
    },

    // Grid
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        rowGap: 16,
    },
    cardWrapper: {
        width: "48%",
    },
    moreCard: {
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
        aspectRatio: 1,
        borderRadius: 16,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    cardPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    label: {
        fontSize: 17,
        fontWeight: "600",
        textAlign: "center",
    },
});
