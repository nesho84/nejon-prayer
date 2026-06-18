import { useThemeStore } from '@/store/themeStore';
import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
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
    const navigationBarStyle = resolvedTheme === "dark" ? "light" : "dark";

    // Set the navigationBarStyle style imperatively;
    // because the <NavigationBar> component's setHidden path throws:
    // "[Error: Uncaught (in promise, id: 0) Error: Call to function 'ExpoNavigationBar.setHidden' has been rejected." during activity teardown.
    useEffect(() => {
        NavigationBar.setStyle(navigationBarStyle);
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
