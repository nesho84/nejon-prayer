import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { useThemeContext } from "@/contexts/ThemeContext";
import useTranslation from "@/hooks/useTranslation";

export default function AboutScreen() {
    const { theme } = useThemeContext();
    const { tr } = useTranslation();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
            <View style={styles.inner}>
                <Image style={styles.logo} source={require("../../assets/icons/icon.png")} />

                <Text style={[styles.title, { color: theme.text2 }]}>{tr("labels.aboutText1")}</Text>
                <Text style={[styles.desc, { color: theme.placeholder }]}>{tr("labels.aboutText2")}</Text>

                <Text style={[styles.yearText, { color: theme.text2 }]}>
                    ©{(new Date()).getFullYear()} <Text style={{ fontSize: 16, color: theme.info }}>nejon.net</Text>
                </Text>
                <Text style={[styles.versionText, { color: theme.placeholder }]}>
                    Version {Constants.expoConfig.version}
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
    },
    desc: {
        paddingBottom: 26,
        fontSize: 15,
        textAlign: "center",
    },
    versionText: {
        marginVertical: 8,
        fontWeight: "bold",
    },
    yearText: {
        fontWeight: "bold",
        fontSize: 15,
    },
});