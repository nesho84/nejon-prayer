import AppScreen from "@/components/AppScreen";
import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { Stack } from "expo-router";
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function AboutScreen() {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const tr = useLanguageStore((state) => state.tr);

    // ------------------------------------------------------------
    // Open external link
    // ------------------------------------------------------------
    const openLink = (url: string) => {
        Linking.canOpenURL(url).then((supported) => {
            if (supported) {
                Linking.openURL(url);
            }
        });
    };

    // ------------------------------------------------------------
    // Open app info/settings
    // ------------------------------------------------------------
    const openAppInfo = () => {
        Linking.openSettings();
    };

    return (
        <AppScreen>

            {/* Top Navigation bar */}
            <Stack.Screen
                options={{
                    title: tr.labels.about,
                    headerRight: () => (
                        <TouchableOpacity onPress={openAppInfo} style={styles.headerIcon} activeOpacity={0.3}>
                            <MaterialCommunityIcons name="information-outline" size={22} color={theme.text} />
                        </TouchableOpacity>
                    ),
                }}
            />

            <ScrollView
                style={[styles.scrollContainer, { backgroundColor: theme.bg }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero: Logo + Title + Version */}
                <View style={styles.heroSection}>
                    <Image style={styles.logo} source={require("../../../assets/icons/icon-bg.png")} />
                    <Text style={[styles.title, { color: theme.text }]}>
                        {Constants?.expoConfig?.name}
                    </Text>
                    <Text style={[styles.versionText, { color: theme.placeholder }]}>
                        Version {Constants?.expoConfig?.version}
                    </Text>
                </View>

                {/* Support / PayPal Card */}
                <TouchableOpacity
                    style={[styles.supportButton, {
                        backgroundColor: theme.primary + '08',
                        borderColor: theme.primary + '20'
                    }]}
                    onPress={() => Linking.openURL('https://paypal.me/NeshatAdemi?locale.x=de_DE&country.x=AT')}
                    activeOpacity={0.8}
                >
                    <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
                        <MaterialCommunityIcons name="heart-outline" size={22} color={theme.danger} />
                    </View>
                    <View style={styles.supportTextContainer}>
                        <Text style={[styles.supportTitle, { color: theme.textMuted }]}>{tr.labels.supportDesc}</Text>
                        <Text style={[styles.supportSubtitle, { color: theme.primary }]}>via PayPal</Text>
                    </View>
                    <MaterialCommunityIcons name="open-in-new" size={18} color={theme.primary} style={{ opacity: 0.5 }} />
                </TouchableOpacity>

                {/* Bottom Buttons */}
                <View style={styles.buttonsSection}>
                    <TouchableOpacity
                        style={[styles.pillButton, { backgroundColor: theme.overlayLight, borderColor: theme.divider2 }]}
                        onPress={() => openLink("https://nejon-prayer.nejon.net/privacy.html")}
                        activeOpacity={0.75}
                    >
                        <MaterialCommunityIcons name="shield-lock-outline" size={18} color={theme.primary} />
                        <Text style={[styles.pillButtonText, { color: theme.text2 }]}>Privacy Policy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.pillButton, { backgroundColor: theme.overlayLight, borderColor: theme.divider2 }]}
                        onPress={() => openLink("https://nejon.net")}
                        activeOpacity={0.75}
                    >
                        <MaterialCommunityIcons name="web" size={18} color={theme.primary} />
                        <Text style={[styles.pillButtonText, { color: theme.text2 }]}>nejon.net</Text>
                    </TouchableOpacity>
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
        justifyContent: 'space-between',
        paddingBottom: 32,
    },

    // Header
    headerIcon: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },

    // Hero section
    heroSection: {
        alignItems: 'center',
        paddingTop: 48,
        paddingBottom: 32,
        gap: 10,
    },
    logo: {
        width: 96,
        height: 96,
        borderRadius: 22,
        marginBottom: 6,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        textAlign: "center",
        letterSpacing: -0.5,
    },
    versionText: {
        fontSize: 14,
        fontWeight: "400",
    },

    // Support Button
    supportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderRadius: 16,
        gap: 16,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    supportTextContainer: {
        flex: 1,
        gap: 3,
    },
    supportTitle: {
        fontSize: 16,
        fontWeight: "600",
        letterSpacing: -0.3,
    },
    supportSubtitle: {
        fontSize: 14,
        fontWeight: "400",
        opacity: 0.6,
    },

    // Bottom pill buttons
    buttonsSection: {
        paddingHorizontal: 16,
        paddingTop: 32,
        gap: 12,
    },
    pillButton: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 18,
        borderWidth: 1,
        borderRadius: 50,
    },
    pillButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },
});
