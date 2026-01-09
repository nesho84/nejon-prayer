import { Image, StyleSheet, Text, View, Linking, TouchableOpacity, ScrollView } from "react-native";
import Constants from "expo-constants";
import { useThemeContext } from "@/context/ThemeContext";
import useTranslation from "@/hooks/useTranslation";
import AppFullScreen from "@/components/AppFullScreen";

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

                {/* App Logo */}
                <Image style={styles.logo} source={require("../../../assets/icons/icon-bg.png")} />

                {/* About Title */}
                <Text style={[styles.title, { color: theme.text }]}>
                    {tr("labels.aboutText1")}
                </Text>

                {/* About Description */}
                <Text style={[styles.desc, { color: theme.placeholder }]} adjustsFontSizeToFit>
                    {tr("labels.aboutText2")}
                </Text>

                {/* Website & Privacy */}
                <View style={styles.linksContainer}>
                    <TouchableOpacity onPress={() => openLink("https://nejon.net")}>
                        <Text style={[styles.linkText, { color: theme.info }]}>nejon.net</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openLink("https://nejon-prayer.nejon.net/privacy.html")}>
                        <Text style={[styles.linkText, { color: theme.info }]}>Privacy Policy</Text>
                    </TouchableOpacity>
                </View>

                {/* Year & App Version */}
                <Text style={[styles.yearText, { color: theme.text2 }]}>
                    © {new Date().getFullYear()}
                </Text>
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
    linksContainer: {
        flexDirection: "row",
        gap: 16,
        marginBottom: 16,
    },
    linkText: {
        fontSize: 16,
        fontWeight: "600",
        textDecorationLine: "underline",
    },
    yearText: {
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 4,
    },
    versionText: {
        fontSize: 14,
        fontWeight: "400",
    },
});
