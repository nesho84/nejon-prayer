import { darkTheme, lightTheme } from "@/constants/themes";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";
import { Appearance } from "react-native";

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const THEME_KEY = "@app_theme_v1";

    const [themeLoading, setThemeLoading] = useState(true);
    const [currentTheme, setCurrentTheme] = useState("system");
    const [systemTheme, setSystemTheme] = useState(Appearance.getColorScheme() || "light");
    const [appTheme, setAppTheme] = useState(lightTheme);

    // Convert currentTheme or systemTheme to theme object
    const resolveTheme = (value) => {
        if (value === "system") {
            return systemTheme === "dark" ? darkTheme : lightTheme;
        }
        return value === "dark" ? darkTheme : lightTheme;
    };

    // Load saved theme from storage
    const loadTheme = async () => {
        try {
            const saved = await AsyncStorage.getItem(THEME_KEY);
            const value = saved || "system";
            setCurrentTheme(value);
            setAppTheme(resolveTheme(value));
        } catch (e) {
            console.warn("Failed to load theme", e);
            setAppTheme(lightTheme);
        } finally {
            setThemeLoading(false);
        }
    };

    // Save theme to storage and update context
    const changeTheme = async (value) => {
        try {
            setCurrentTheme(value);
            setAppTheme(resolveTheme(value));
            await AsyncStorage.setItem(THEME_KEY, value);
        } catch (e) {
            console.warn("Failed to save theme", e);
        }
    };

    // Load theme once on mount
    useEffect(() => {
        loadTheme();
    }, []);

    // Listen for system changes if currentTheme is "system"
    useEffect(() => {
        const listener = ({ colorScheme }) => {
            setSystemTheme(colorScheme || "light");
            if (currentTheme === "system") {
                setAppTheme(colorScheme === "dark" ? darkTheme : lightTheme);
            }
        };
        const subscribe = Appearance.addChangeListener(listener);

        return () => {
            if (subscribe?.remove) subscribe.remove();
        };
    }, [currentTheme]);

    return (
        <ThemeContext.Provider
            value={{
                theme: appTheme,
                currentTheme,
                changeTheme,
                themeLoading,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useThemeContext() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useThemeContext must be used within a ThemeProvider');
    }
    return context;
}
