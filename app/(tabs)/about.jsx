import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function About() {
    // ThemeContext
    const { theme } = useTheme();
    // LanguageContext
    const { lang } = useLanguage();

    return (
        <SafeAreaView style={{ ...styles.container, backgroundColor: theme.background }}>
            <View style={styles.inner}>
                <Image style={styles.logo} source={require("../../assets/images/icon.png")} />

                <Text style={styles.title}>{lang.tr("labels.aboutText1")}</Text>
                <Text style={styles.desc}>{lang.tr("labels.aboutText2")}</Text>

                <Text style={styles.yearText}>
                    ©{(new Date()).getFullYear()} <Text style={styles.link}>nejon.net</Text>
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    inner: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    logo: {
        marginBottom: 8,
        width: 150,
        height: 150,
    },
    title: {
        paddingBottom: 12,
        fontWeight: "bold",
        fontSize: 25,
        color: "#777",
    },
    desc: {
        paddingBottom: 26,
        fontSize: 16,
        textAlign: "center",
        color: "#888",
    },
    yearText: {
        fontWeight: "bold",
        fontSize: 16,
        color: "#999",
    },
    link: {
        color: "skyblue",
        fontSize: 16,
    },
});