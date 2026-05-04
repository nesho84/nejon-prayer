import AppScreen from "@/components/AppScreen";
import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
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

    return (
        <AppScreen>
            <ScrollView
                style={[styles.scrollContainer, { backgroundColor: theme.bg }]}
                contentContainerStyle={[styles.scrollContent]}
                showsVerticalScrollIndicator={false}
            >

                {/* Logo */}
                <Image style={styles.logo} source={require("../../../assets/icons/icon-bg.png")} />

                {/* Title */}
                <Text style={[styles.title, { color: theme.text }]}>
                    {tr.labels.aboutText1}
                </Text>

                {/* Description */}
                <Text style={[styles.desc, { color: theme.placeholder }]} adjustsFontSizeToFit>
                    {tr.labels.aboutText2}
                </Text>

                {/* Website & Privacy */}
                <View style={styles.linksContainer}>
                    <TouchableOpacity
                        style={[styles.chip, { borderColor: theme.border, backgroundColor: theme.card }]}
                        onPress={() => openLink("https://nejon.net")}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons name="web" size={13} color={theme.placeholder} />
                        <Text style={[styles.chipText, { color: theme.primary }]}>nejon.net</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.chip, { borderColor: theme.border, backgroundColor: theme.card }]}
                        onPress={() => openLink("https://nejon-prayer.nejon.net/privacy.html")}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons name="shield-lock-outline" size={13} color={theme.placeholder} />
                        <Text style={[styles.chipText, { color: theme.primary }]}>Privacy Policy</Text>
                    </TouchableOpacity>
                </View>

                {/* Support Section */}
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

                {/* Version */}
                <Text style={[styles.versionText, { color: theme.placeholder }]}>
                    Version {Constants?.expoConfig?.version}
                </Text>

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
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 12,
        paddingBottom: 24,
        paddingHorizontal: 16,
        gap: 16,
    },

    logo: {
        width: 120,
        height: 120,
        borderRadius: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: "700",
        textAlign: "center",
    },
    desc: {
        fontSize: 15,
        fontWeight: "400",
        textAlign: "justify",
        lineHeight: 22,
        marginBottom: 8,
        paddingHorizontal: 10,
    },

    // Links
    linksContainer: {
        flexDirection: "row",
        gap: 10,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '500',
    },

    // Support Button
    supportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderRadius: 16,
        marginTop: 18,
        marginBottom: 12,
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

    versionText: {
        fontSize: 14,
        fontWeight: "400",
    },
});
