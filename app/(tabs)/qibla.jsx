import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "@/contexts/ThemeContext";
import useTranslation from "@/hooks/useTranslation";

export default function QiblaScreen() {
    const { theme } = useThemeContext();
    const { tr } = useTranslation();

    return (
        <View style={[styles.content, { backgroundColor: theme.bg }]}>

            <Ionicons name="compass" size={100} color={theme.placeholder} style={{ marginBottom: 24 }} />

            {/* Description */}
            <Text style={[styles.desc, { color: theme.placeholder }]}>
                Comming Soon...
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
    desc: {
        fontSize: 16,
        fontWeight: "400",
        textAlign: "center",
        marginBottom: 28,
        lineHeight: 22,
    },
});
