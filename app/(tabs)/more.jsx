import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons, MaterialCommunityIcons as McIcons } from "@expo/vector-icons";
import { useThemeContext } from "@/contexts/ThemeContext";
import AppScreen from '@/components/AppScreen';
import useTranslation from "@/hooks/useTranslation";

export default function MoreScreen() {
    const { theme } = useThemeContext();
    const { tr } = useTranslation();

    const features = [
        // { href: "extra/namazi", label: "Namazi", icon: "timer-outline", color: "#3b82f6" },
        { href: "extra/namazi", label: "Namazi", color: "#3b82f6", icon: <Ionicons name="timer-outline" size={32} color="#3b82f6" /> },
        { href: "extra/abdesi", label: "Abdesi", color: "#06b6d4", icon: <Ionicons name="water-outline" size={30} color="#06b6d4" /> },
        { href: "extra/tesbih", label: "Tesbih", color: "#8b5cf6", icon: <McIcons name="counter" size={34} color="#8b5cf6" /> },
        { href: "extra/about", label: "About", color: "#f59e0b", icon: <McIcons name="information-outline" size={32} color="#f59e0b" /> },
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
                    <Text style={[styles.title, { color: theme.text }]}>{tr("labels.more")}</Text>
                    <Text style={[styles.subtitle, { color: theme.text2 }]}>
                        Explore additional features
                    </Text>
                </View>

                {/* Feature Cards */}
                <View style={styles.grid}>
                    {features.map((item) => (
                        <Link key={item.href} href={item.href} asChild>
                            <Pressable style={styles.cardWrapper}>
                                {({ pressed }) => (
                                    <View style={[styles.card, { backgroundColor: theme.card }, pressed && styles.cardPressed]}>
                                        <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
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
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingTop: 36,
        paddingBottom: 20,
        gap: 16,
    },

    // Header
    header: {
        alignSelf: "left",
        // paddingLeft: 3,
        paddingBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        opacity: 0.7,
    },

    // Grid
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    cardWrapper: {
        width: '47%',
    },
    card: {
        aspectRatio: 1,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    cardPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    label: {
        fontSize: 17,
        fontWeight: '600',
        textAlign: 'center',
    },
});