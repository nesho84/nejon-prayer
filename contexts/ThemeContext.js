import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { darkTheme, lightTheme } from "@/constants/colors";

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const THEME_KEY = "@app_theme_v1";

    const [themeMode, setThemeMode] = useState("system"); // "light" | "dark" | "system"
    const [theme, setTheme] = useState(lightTheme);       // actual theme object for UI
    const [resolvedTheme, setResolvedTheme] = useState("light"); // "light" or "dark"
    const [themeLoading, setThemeLoading] = useState(true);

    // ------------------------------------------------------------
    // Resolve theme
    // ------------------------------------------------------------
    const resolveTheme = useCallback((mode) => {
        const system = Appearance.getColorScheme() || "light";
        const finalMode = mode === "system" ? system : mode;
        setResolvedTheme(finalMode);
        return finalMode === "dark" ? darkTheme : lightTheme;
    }, []);

    // ------------------------------------------------------------
    // Whenever themeMode changes, resolve theme
    // ------------------------------------------------------------
    useEffect(() => {
        setTheme(resolveTheme(themeMode));
    }, [themeMode, resolveTheme]);

    // ------------------------------------------------------------
    // Load saved theme from storage
    // ------------------------------------------------------------
    const loadTheme = async () => {
        try {
            const saved = await AsyncStorage.getItem(THEME_KEY);
            const mode = saved || "system";
            setThemeMode(mode);
            setTheme(resolveTheme(mode));
        } catch (err) {
            console.warn("❌ Failed to load theme, defaulting to light", err);
            setThemeMode("system");
            setTheme(lightTheme);
        } finally {
            setThemeLoading(false);
        }
    };

    // ------------------------------------------------------------
    // Change theme manually
    // ------------------------------------------------------------
    const changeTheme = useCallback(async (mode) => {
        setThemeMode(mode);
        setTheme(resolveTheme(mode));
        try {
            await AsyncStorage.setItem(THEME_KEY, mode);
        } catch (err) {
            console.warn("❌ Failed to save theme", err);
        } finally {
            setThemeLoading(false);
        }
    }, [resolveTheme]);

    // ------------------------------------------------------------
    // Auto-load on mount
    // ------------------------------------------------------------
    useEffect(() => {
        loadTheme();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ------------------------------------------------------------
    // Listen to system changes
    // ------------------------------------------------------------
    useEffect(() => {
        if (themeMode !== "system") return;

        const listener = ({ colorScheme }) => {
            const newResolvedName = colorScheme || "light";
            setResolvedTheme(newResolvedName);
            setTheme(newResolvedName === "dark" ? darkTheme : lightTheme);
        };

        const subscription = Appearance.addChangeListener(listener);
        return () => subscription?.remove?.();
    }, [themeMode]);

    // ------------------------------------------------------------
    // Memoize context value to prevent unnecessary re-renders
    // ------------------------------------------------------------
    const contextValue = useMemo(() => ({
        theme,
        themeMode,
        changeTheme,
        resolvedTheme,
        themeLoading,
    }), [theme, themeMode, changeTheme, resolvedTheme, themeLoading]);

    return (
        <ThemeContext.Provider value={contextValue}>
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
