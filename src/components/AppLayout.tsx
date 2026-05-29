import { useThemeStore } from '@/store/themeStore';
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from "expo-status-bar";
import { useEffect } from 'react';
import { Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
    children: React.ReactNode;
}

export default function AppLayout({ children }: Props) {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const resolvedTheme = useThemeStore((state) => state.resolvedTheme);

    // Determine status bar and navigation bar styles based on the resolved theme
    const statusBarStyle = resolvedTheme === "dark" ? "light" : "dark";
    const navigationBarStyle = resolvedTheme === "dark" ? "dark" : "light";

    // Sync navigation bar style with theme changes on Android
    useEffect(() => {
        if (Platform.OS === 'android') {
            NavigationBar.setStyle(navigationBarStyle);
        }
    }, [navigationBarStyle]);

    return (
        <>
            <StatusBar style={statusBarStyle} />
            <SafeAreaView
                style={{ flex: 1, backgroundColor: theme.bg }}
                edges={['left', 'right']}
            >
                {children}
            </SafeAreaView>
        </>
    );
}
