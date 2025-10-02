import { Image, StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";
import { useThemeContext } from "@/contexts/ThemeContext";
import useTranslation from "@/hooks/useTranslation";

export default function AboutScreen() {
    const { theme } = useThemeContext();
    const { tr } = useTranslation();

    return (
        <View style={[styles.content, { backgroundColor: theme.bg }]}>

            {/* App Logo */}
            <Image style={styles.logo} source={require("../../assets/icons/icon.png")} />

            {/* About Title */}
            <Text style={[styles.title, { color: theme.text }]}>
                {tr("labels.aboutText1")}
            </Text>

            {/* About Description */}
            <Text style={[styles.desc, { color: theme.placeholder }]}>
                {tr("labels.aboutText2")}
            </Text>

            {/* Year & Website */}
            <Text style={[styles.yearText, { color: theme.text2 }]}>
                ©{new Date().getFullYear()} <Text style={{ fontSize: 16, color: theme.info }}>nejon.net</Text>
            </Text>

            {/* App Version */}
            <Text style={[styles.versionText, { color: theme.placeholder }]}>
                Version {Constants.expoConfig.version}
            </Text>

        </View>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    logo: {
        width: 150,
        height: 150,
        marginBottom: 24,
        borderRadius: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 12,
    },
    desc: {
        fontSize: 16,
        fontWeight: "400",
        textAlign: "center",
        marginBottom: 28,
        lineHeight: 22,
    },
    yearText: {
        fontSize: 15,
        fontWeight: "600",
        marginBottom: 6,
    },
    versionText: {
        fontSize: 14,
        fontWeight: "400",
        color: '#888',
    },
});
