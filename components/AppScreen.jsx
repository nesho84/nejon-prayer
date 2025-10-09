import { Platform, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useThemeContext } from "@/contexts/ThemeContext";
import { useSegments } from "expo-router";

export default function AppScreen({ children }) {
    const { theme, resolvedTheme } = useThemeContext();
    const barStyle = resolvedTheme === "dark" ? "light" : "dark";

    const insets = useSafeAreaInsets();
    const segments = useSegments();

    const ignoreBottom = segments.includes("(tabs)");
    const insideOtherStack = segments.some(s => s.includes("extras"));

    // Fix for Android 14+ safe area regression
    const topInset = Platform.OS === "android" && (!insets.top || insets.top < 24)
        ? StatusBar.currentHeight || 24
        : insets.top;

    return (
        <>
            <StatusBar style={barStyle} />
            <SafeAreaView
                style={[
                    styles.container,
                    {
                        backgroundColor: theme.bg,
                        paddingTop: insideOtherStack ? 0 : topInset,
                        paddingBottom: ignoreBottom ? 0 : insets.bottom
                    }
                ]}
                edges={['left', 'right']}
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
