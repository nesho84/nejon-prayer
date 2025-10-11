import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useThemeContext } from "@/context/ThemeContext";

export default function AppLoading({ text = "Loading...", style, ...otherProps }) {
    const { theme } = useThemeContext();

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: theme.bg },
                style
            ]}
            {...otherProps}
        >
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.loadingText, { color: theme.placeholder }]}>
                {text}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    loadingText: {
        fontSize: 20,
        marginTop: 12,
    }
});
