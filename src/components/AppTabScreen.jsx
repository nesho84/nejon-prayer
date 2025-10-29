import { Platform, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useThemeContext } from "@/context/ThemeContext";

export default function AppTabScreen({ children }) {
    const { theme, resolvedTheme } = useThemeContext();
    const insets = useSafeAreaInsets();
    const barStyle = resolvedTheme === "dark" ? "light" : "dark";

    // Fix for Android 14+ safe area regression
    const topInset = Platform.OS === "android" && (!insets.top || insets.top < 24)
        ? StatusBar.currentHeight || 24
        : insets.top;

    return (
        <>
            <StatusBar style={barStyle} />
            <SafeAreaView
                style={[styles.container, { backgroundColor: theme.bg, paddingTop: topInset, }]}
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
