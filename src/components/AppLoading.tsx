import { useThemeStore } from "@/store/themeStore";
import { ActivityIndicator, StyleSheet, Text, View, ViewStyle } from "react-native";

interface Props {
    text?: string;
    inline?: boolean;
    style?: ViewStyle | ViewStyle[];
}

export default function AppLoading({ text = "Loading...", inline = false, style }: Props) {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const isReady = useThemeStore((state) => state.isReady);

    if (!isReady) return null;

    const containerStyle = inline
        ? [styles.inlineContainer, { backgroundColor: "rgba(0,0,0,0.75)" }]
        : [styles.fullContainer, { backgroundColor: theme.bg }];

    return (
        <View style={[...containerStyle, style]} pointerEvents="auto">
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.loadingText, { color: theme.text2, opacity: 0.8 }]}>
                {text}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    fullContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    inlineContainer: {
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
    },
    loadingText: {
        fontSize: 18,
        marginTop: 10,
        textAlign: "center",
    },
});