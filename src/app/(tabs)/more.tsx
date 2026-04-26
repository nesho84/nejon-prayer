import AppCard from "@/components/AppCard";
import AppTabScreen from "@/components/AppTabScreen";
import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

interface MenuItem {
    id: number;
    type: 'internal' | 'external';
    href: any;
    label: string;
    description: string;
    color: string;
    bg: string;
    icon: any;
}

export default function ExtrasScreen() {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const tr = useLanguageStore((state) => state.tr);

    const features: MenuItem[] = [
        {
            id: 1,
            href: "(extras)/abdesi",
            type: 'internal',
            label: tr.labels.abdes,
            description: tr.labels.abdesDesc || "Step by step ablution guide",
            color: "#06b6d4",
            bg: "#06b6d426",
            icon: <MaterialCommunityIcons name="hand-wash-outline" size={32} color="#06b6d4" />
        },
        {
            id: 2,
            href: "(extras)/namazi",
            type: 'internal',
            label: tr.labels.namaz,
            description: tr.labels.namazDesc || "Learn how to perform Salah",
            color: "#3b82f6",
            bg: "#3b82f626",
            icon: <MaterialCommunityIcons name="mosque-outline" size={32} color="#3b82f6" />
        },
        {
            id: 3,
            href: "(extras)/tesbih",
            type: 'internal',
            label: tr.labels.tesbih,
            description: tr.labels.tesbihDesc || "Digital prayer beads counter",
            color: "#8b5cf6",
            bg: "#8b5cf626",
            icon: <MaterialCommunityIcons name="counter" size={36} color="#8b5cf6" />
        },
        {
            id: 5,
            href: "(extras)/ramazani",
            type: 'internal',
            label: tr.labels.ramadan,
            description: tr.labels.ramadanDesc || "Digital prayer beads counter",
            color: "#06b6d4",
            bg: "#06b6d426",
            icon: <Ionicons name="moon-outline" size={32} color="#06b6d4" />
        },
        {
            id: 6,
            href: "(extras)/about",
            type: 'internal',
            label: tr.labels.about,
            description: tr.labels.aboutDesc || "App information & credits",
            color: "#2563eb",
            bg: "#2563eb26",
            icon: <MaterialCommunityIcons name="information-outline" size={32} color="#2563eb" />
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
                        {tr.labels.extrasTitle || "Explore Features"}
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: theme.text2 }]}>
                        {tr.labels.extrasSubtitle || "Enhance your spiritual journey with these tools"}
                    </Text>
                </AppCard>

                {/* Feature List Card */}
                <AppCard style={styles.listCard}>
                    {features.map((item, index) => {

                        // Renders each item in the list, wrapped in the appropriate Pressable/Link based on type
                        const renderItem = () => (
                            <View style={styles.listItem}>
                                {/* Left: Icon */}
                                <View style={[styles.itemIconContainer, { backgroundColor: item.bg }]}>
                                    {item.icon}
                                </View>

                                {/* Center: Item title and description below */}
                                <View style={styles.itemTextContainer}>
                                    <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>
                                        {item.label}
                                    </Text>
                                    <Text style={[styles.itemDescription, { color: theme.text2 }]} numberOfLines={2}>
                                        {item.description}
                                    </Text>
                                </View>

                                {/* Right: Chevron right */}
                                <Ionicons name="chevron-forward" size={20} color={theme.text2} />
                            </View>
                        );

                        return (
                            <View key={item.id}>
                                {/* Internal Link */}
                                {item.type === 'internal' && (
                                    <Pressable
                                        style={({ pressed }) => [{ opacity: pressed ? 0.3 : 1 }]}
                                        android_ripple={{ color: theme.shadow, borderless: false }}
                                        onPress={() => router.navigate(item.href)}
                                    >
                                        {renderItem()}
                                    </Pressable>
                                )}

                                {/* External Link */}
                                {item.type === 'external' && (
                                    <Pressable
                                        style={({ pressed }) => [{ opacity: pressed ? 0.3 : 1 }]}
                                        android_ripple={{ color: theme.shadow, borderless: false }}
                                        onPress={() => Linking.openURL(item.href)}
                                    >
                                        {renderItem()}
                                    </Pressable>
                                )}

                                {index < features.length - 1 && (
                                    <View style={[styles.divider, { backgroundColor: theme.divider2 }]} />
                                )}
                            </View>
                        );
                    })}
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
        paddingTop: 12,
        paddingBottom: 24,
        paddingHorizontal: 8,
        gap: 12,
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
    divider: {
        height: 1,
        marginHorizontal: 18,
    },
});