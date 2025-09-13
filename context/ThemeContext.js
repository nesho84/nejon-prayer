// ThemeContext.tsx
import { darkTheme, lightTheme } from "@/constants/themes";
import { loadSettings } from "@/hooks/storage";
import { createContext, useContext, useEffect, useState } from "react";
import { Appearance } from "react-native";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [currentTheme, setCurrentTheme] = useState("system");
    const [activeTheme, setActiveTheme] = useState(Appearance.getColorScheme() || "light");

    // Load saved settings
    useEffect(() => {
        (async () => {
            const saved = await loadSettings();
            if (saved?.theme) {
                setCurrentTheme(saved.theme);
            }
        })();
    }, []);

    // Watch system changes
    useEffect(() => {
        // Update activeTheme based on currentTheme
        if (currentTheme === "system") {
            setActiveTheme(Appearance.getColorScheme() || "light");
        } else {
            setActiveTheme(currentTheme);
        }

        // Subscribe to system changes only if "system" is selected
        const listener = ({ colorScheme }) => {
            if (currentTheme === "system" && colorScheme) {
                setActiveTheme(colorScheme);
            }
        };
        const sub = Appearance.addChangeListener(listener);

        return () => {
            if (sub?.remove) sub.remove();
        };
    }, [currentTheme]);

    const changeTheme = async (value) => {
        // just update context, screens handle saving in storage
        setCurrentTheme(value);
    };

    const theme = activeTheme === "dark" ? darkTheme : lightTheme;

    return (
        <ThemeContext.Provider value={{ theme, currentTheme, activeTheme, changeTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
