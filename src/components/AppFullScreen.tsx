import { View, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { StatusBar } from "expo-status-bar";
import { useThemeStore } from '@/store/themeStore';

interface Props {
    children: React.ReactNode;
}

export default function AppFullScreen({ children }: Props) {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const resolvedTheme = useThemeStore((state) => state.resolvedTheme);

    const insets = useSafeAreaInsets();
    const headerHeight = useHeaderHeight(); // 0 if headerShown: false
    const barStyle = resolvedTheme === "dark" ? "light" : "dark";

    // Fix for Android 14+ safe area regression
    // Top inset: only for screens without a header
    let topInset = 0;
    if (headerHeight === 0) {
        if (Platform.OS === "android") {
            topInset = (StatusBar as any).currentHeight || 24
        } else {
            topInset = insets.top;
        }
    }

    // Bottom inset for Android soft nav bar / gestures
    const bottomInset = Platform.OS === "android"
        ? insets.bottom // will be 0 on some gesture nav devices, but best effort
        : insets.bottom;

    return (
        <>
            <StatusBar style={barStyle} />
            <View
                style={[styles.container, {
                    backgroundColor: theme.bg,
                    paddingTop: topInset,
                    paddingBottom: bottomInset
                }]}
            >
                {children}
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
});
