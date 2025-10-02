import { StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useThemeContext } from "@/contexts/ThemeContext";
import { useSegments } from "expo-router";

export default function AppScreen({ children }) {
    const { theme, resolvedTheme } = useThemeContext();
    const barStyle = resolvedTheme === "dark" ? "light" : "dark";

    const insets = useSafeAreaInsets();
    const segments = useSegments();

    // Automatically ignore bottom if inside tabs
    const ignoreBottom = segments.includes("(tabs)");

    return (
        <>
            <StatusBar style={barStyle} />
            <SafeAreaView
                style={[
                    styles.container,
                    { backgroundColor: theme.bg, paddingBottom: ignoreBottom ? 0 : insets.bottom }
                ]}
                edges={['top', 'left', 'right']} // bottom handled manually
            >
                {children}
            </SafeAreaView>
        </>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
