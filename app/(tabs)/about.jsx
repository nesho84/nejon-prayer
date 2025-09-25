import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { useThemeContext } from "@/contexts/ThemeContext";
import useTranslation from "@/hooks/useTranslation";

export default function AboutScreen() {
    const { theme } = useThemeContext();
    const { tr } = useTranslation();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.inner}>
                <Image style={styles.logo} source={require("../../assets/icons/icon.png")} />

                <Text style={styles.title}>{tr("labels.aboutText1")}</Text>
                <Text style={styles.desc}>{tr("labels.aboutText2")}</Text>

                <Text style={styles.versionText}>Version {Constants.manifest.version}</Text>

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
        marginBottom: 16,
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
        fontSize: 14,
        textAlign: "center",
        color: "#888",
    },
    versionText: {
        paddingBottom: 8,
        fontWeight: "bold",
        fontSize: 15,
        color: "#888",
    },
    yearText: {
        fontWeight: "bold",
        fontSize: 15,
        color: "#999",
    },
    link: {
        color: "skyblue",
        fontSize: 16,
    },
});