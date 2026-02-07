import { Platform, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useThemeStore } from '@/store/themeStore';

interface Props {
    children: React.ReactNode;
}

export default function AppTabScreen({ children }: Props) {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const resolvedTheme = useThemeStore((state) => state.resolvedTheme);

    const insets = useSafeAreaInsets();
    const barStyle = resolvedTheme === "dark" ? "light" : "dark";

    // Fix for Android 14+ safe area regression
    const topInset = Platform.OS === "android" && (!insets.top || insets.top < 24)
        ? (StatusBar as any).currentHeight || 24
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
