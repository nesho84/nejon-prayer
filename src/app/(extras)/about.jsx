import { Image, StyleSheet, Text, View, Alert } from "react-native";
import Constants from "expo-constants";
import { useThemeContext } from "@/context/ThemeContext";
import AppScreen from "@/components/AppScreen";
import useTranslation from "@/hooks/useTranslation";

export default function AboutScreen() {
    const { theme } = useThemeContext();
    const { tr } = useTranslation();

    return (
        <AppScreen>
            <View style={[styles.content, { backgroundColor: theme.bg }]}>

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

                {/* Year & Website */}
                <Text style={[styles.yearText, { color: theme.text2 }]}>
                    ©{new Date().getFullYear()} <Text style={{ fontSize: 16, color: theme.info }}>nejon.net</Text>
                </Text>

                {/* App Version */}
                <Text style={[styles.versionText, { color: theme.placeholder }]}>
                    Version {Constants?.expoConfig?.version}
                </Text>

            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 24,
        gap: 16,
    },
    logo: {
        width: 150,
        height: 150,
        marginBottom: 5,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        textAlign: "center",
    },
    desc: {
        fontSize: 16,
        fontWeight: "400",
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 8,
    },
    yearText: {
        fontSize: 15,
        fontWeight: "600",
        marginBottom: -8,
    },
    versionText: {
        fontSize: 14,
        fontWeight: "400",
        color: '#888',
    },
});
