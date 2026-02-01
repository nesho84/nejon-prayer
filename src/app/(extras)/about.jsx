import { Image, StyleSheet, Text, View, Linking, TouchableOpacity, ScrollView } from "react-native";
import Constants from "expo-constants";
import { useThemeContext } from "@/context/ThemeContext";
import useTranslation from "@/hooks/useTranslation";
import AppFullScreen from "@/components/AppFullScreen";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function AboutScreen() {
    const { theme } = useThemeContext();
    const { tr } = useTranslation();

    const openLink = (url) => {
        Linking.canOpenURL(url).then((supported) => {
            if (supported) {
                Linking.openURL(url);
            }
        });
    };

    return (
        <AppFullScreen>
            <ScrollView
                style={[styles.scrollContainer, { backgroundColor: theme.bg }]}
                contentContainerStyle={[styles.scrollContent]}
                showsVerticalScrollIndicator={false}
            >

                {/* Logo */}
                <Image style={styles.logo} source={require("../../../assets/icons/icon-bg.png")} />

                {/* Title */}
                <Text style={[styles.title, { color: theme.text }]}>
                    {tr("labels.aboutText1")}
                </Text>

                {/* Description */}
                <Text style={[styles.desc, { color: theme.placeholder }]} adjustsFontSizeToFit>
                    {tr("labels.aboutText2")}
                </Text>

                {/* Website & Privacy */}
                <View style={[styles.linksContainer, { backgroundColor: 'transparent' }]}>
                    <TouchableOpacity onPress={() => openLink("https://nejon.net")}>
                        <Text style={[styles.linkText, { color: theme.info }]}>nejon.net</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openLink("https://nejon-prayer.nejon.net/privacy.html")}>
                        <Text style={[styles.linkText, { color: theme.info }]}>Privacy Policy</Text>
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
                        <Text style={[styles.supportTitle, { color: theme.textMuted }]}>{tr("labels.supportDesc")}</Text>
                        <Text style={[styles.supportSubtitle, { color: theme.primary }]}>via PayPal</Text>
                    </View>
                    <MaterialCommunityIcons name="open-in-new" size={18} color={theme.primary} style={{ opacity: 0.5 }} />
                </TouchableOpacity>

                {/* Version */}
                <Text style={[styles.versionText, { color: theme.placeholder }]}>
                    Version {Constants?.expoConfig?.version}
                </Text>

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
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 24,
        gap: 16,
    },
    logo: {
        width: 160,
        height: 160,
        marginBottom: 16,
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
        textAlign: "center",
        lineHeight: 22,
        marginVertical: 12,
        paddingHorizontal: 10,
    },

    // Support Button
    supportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderRadius: 16,
        marginTop: 16,
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

    linksContainer: {
        flexDirection: "row",
        gap: 16,
    },
    linkText: {
        fontSize: 16,
        fontWeight: "600",
        textDecorationLine: "underline",
    },
    versionText: {
        fontSize: 14,
        fontWeight: "400",
    },
});
