import { StyleSheet } from 'react-native'
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useThemeContext } from "@/contexts/ThemeContext";

export default function AppScreen({ children }) {
    const { theme, resolvedTheme } = useThemeContext();

    const barStyle = resolvedTheme === "dark" ? "light" : "dark";

    return (
        <>
            <StatusBar style={barStyle} />
            <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
                {children}
            </SafeAreaView>
        </>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
})