import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "@/context/ThemeContext";
import useTranslation from "@/hooks/useTranslation";
import AppFullScreen from "@/components/AppFullScreen";

export default function RamazaniScreen() {
    const { theme } = useThemeContext();
    const { tr } = useTranslation();

    return (
        <AppFullScreen>
            <View style={[styles.content, { backgroundColor: theme.bg }]}>

                <Ionicons name="checkmark-circle-outline" size={100} color={theme.placeholder} style={{ marginBottom: 24 }} />

                {/* Description */}
                <Text style={[styles.desc, { color: theme.placeholder }]}>
                    Comming Soon...
                </Text>

            </View>
        </AppFullScreen>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 24,
        gap: 16,
    },
    desc: {
        fontSize: 16,
        fontWeight: "400",
        textAlign: "center",
        marginBottom: 28,
        lineHeight: 22,
    },
});
