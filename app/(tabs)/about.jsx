import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function About() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.inner}>
                <Text style={styles.title}>About This App</Text>
                <Text style={styles.desc}>This is a prayer times and Islamic events app.</Text>

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
        marginBottom: 10,
        width: 150,
        height: 150,
    },
    title: {
        paddingBottom: 10,
        fontWeight: "bold",
        fontSize: 25,
        color: "#777",
    },
    desc: {
        paddingBottom: 16,
        fontSize: 16,
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