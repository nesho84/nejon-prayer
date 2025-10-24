import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "@/context/ThemeContext";
import AppScreen from "@/components/AppScreen";
import useTranslation from "@/hooks/useTranslation";

export default function NamaziScreen() {
    const { theme } = useThemeContext();
    const { tr } = useTranslation();

    return (
        <AppScreen>
            <View style={[styles.content, { backgroundColor: theme.bg }]}>

                <Ionicons name="checkmark-circle-outline" size={100} color={theme.placeholder} style={{ marginBottom: 24 }} />

                {/* Description */}
                <Text style={[styles.desc, { color: theme.placeholder }]}>
                    Comming Soon...
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
        padding: 20,
    },
    desc: {
        fontSize: 16,
        fontWeight: "400",
        textAlign: "center",
        marginBottom: 28,
        lineHeight: 22,
    },
});
