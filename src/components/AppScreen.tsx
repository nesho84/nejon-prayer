import { useThemeStore } from '@/store/themeStore';
import { useHeaderHeight } from "@react-navigation/elements";
import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
    children: React.ReactNode;
}

export default function AppScreen({ children }: Props) {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const resolvedTheme = useThemeStore((state) => state.resolvedTheme);

    const insets = useSafeAreaInsets();
    const headerHeight = useHeaderHeight(); // 0 if headerShown: false
    const barStyle = resolvedTheme === "dark" ? "light" : "dark";

    // Fix for Android 14+ safe area regression
    let topInset = 0;
    if (headerHeight === 0) {
        if (Platform.OS === "android") {
            topInset = (StatusBar as any).currentHeight || 24
        } else {
            topInset = insets.top;
        }
    }

    return (
        <>
            <StatusBar style={barStyle} />
            <SafeAreaView
                style={[
                    styles.container,
                    {
                        backgroundColor: theme.bg,
                        paddingTop: topInset,
                        paddingBottom: insets.bottom,
                    }
                ]}
                edges={['left', 'right']}
            >
                {children}
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
});
