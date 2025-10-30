import { StyleSheet, View, Text, ScrollView, Pressable } from "react-native";
import { Ionicons, MaterialCommunityIcons as McIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useThemeContext } from "@/context/ThemeContext";
import useTranslation from "@/hooks/useTranslation";
import AppTabScreen from "@/components/AppTabScreen";
import AppCard from "@/components/AppCard";

export default function ExtrasScreen() {
    const { theme } = useThemeContext();
    const { tr } = useTranslation();

    const features = [
        {
            id: 1,
            href: "(extras)/abdesi",
            label: tr("labels.abdes"),
            description: tr("labels.abdesDesc") || "Step by step ablution guide",
            color: "#06b6d4",
            bg: "#06b6d426", // ✅ 15% opacity background
            icon: <Ionicons name="water-outline" size={30} color="#06b6d4" />
        },
        {
            id: 2,
            href: "(extras)/namazi",
            label: tr("labels.namaz"),
            description: tr("labels.namazDesc") || "Learn how to perform Salah",
            color: "#3b82f6",
            bg: "#3b82f626",
            icon: <Ionicons name="timer-outline" size={32} color="#3b82f6" />
        },
        {
            id: 3,
            href: "(extras)/tesbih",
            label: tr("labels.tesbih"),
            description: tr("labels.tesbihDesc") || "Digital prayer beads counter",
            color: "#8b5cf6",
            bg: "#8b5cf626",
            icon: <McIcons name="counter" size={32} color="#8b5cf6" />
        },
        {
            id: 4,
            href: "(extras)/ramazani",
            label: tr("labels.ramadan"),
            description: tr("labels.ramadanDesc"),
            color: "#06b6d4",
            bg: "#06b6d426",
            icon: <McIcons name="information-outline" size={32} color="#06b6d4" />
        },
        {
            id: 5,
            href: "(extras)/about",
            label: tr("labels.about"),
            description: tr("labels.aboutDesc") || "App information & credits",
            color: "#f59e0b",
            bg: "#f59e0b26",
            icon: <McIcons name="information-outline" size={32} color="#f59e0b" />
        },
    ];

    return (
        <AppTabScreen>
            <ScrollView
                style={[styles.scrollContainer, { backgroundColor: theme.bg }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >

                {/* Hero Header Section */}
                <AppCard style={styles.headerCard}>
                    <View style={[styles.headerIconContainer, { backgroundColor: "#f59e0b26" }]}>
                        <Ionicons name="apps" size={52} color={theme.accent} />
                    </View>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>
                        {tr("labels.extrasTitle") || "Explore Features"}
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: theme.text2 }]}>
                        {tr("labels.extrasSubtitle") || "Enhance your spiritual journey with these tools"}
                    </Text>
                </AppCard>

                {/* Feature List Card */}
                <AppCard style={styles.listCard}>
                    {features.map((item, index) => (
                        <View key={item.id}>
                            <Link href={item.href} asChild>
                                <Pressable>
                                    {({ pressed }) => (
                                        <View style={[
                                            styles.listItem,
                                            pressed && { backgroundColor: theme.accent + '08', opacity: pressed ? 0.3 : 1 }
                                        ]}>
                                            <View style={[styles.itemIconContainer, { backgroundColor: item.bg }]}>
                                                {item.icon}
                                            </View>

                                            <View style={styles.textContent}>
                                                <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>
                                                    {item.label}
                                                </Text>
                                                <Text style={[styles.itemDescription, { color: theme.text2 }]} numberOfLines={2}>
                                                    {item.description}
                                                </Text>
                                            </View>

                                            <Ionicons name="chevron-forward" size={20} color={theme.text2} />
                                        </View>
                                    )}
                                </Pressable>
                            </Link>

                            {/* Divider */}
                            {index < features.length - 1 && (
                                <View style={[styles.divider, { backgroundColor: theme.divider2 }]} />
                            )}
                        </View>
                    ))}
                </AppCard>

            </ScrollView>
        </AppTabScreen>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 24,
        gap: 16,
    },

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
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContent: {
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
    divider: {
        height: 1,
        marginHorizontal: 18,
        // marginLeft: 86, // Aligns with text (icon width + gap + padding)
    },
});