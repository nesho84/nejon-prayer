import { useEffect, useState } from "react";
import { Appearance } from "react-native";

const lightTheme = {
    background: "#fafafa",       // main background
    card: "lightgrey",           // for cards, containers
    primaryText: "#000000",      // primary text
    secondaryText: "#4D3C3C",    // gray text for subtitles or less important
    primary: "#3b82f6",          // main accent color
    secondary: "#10b981",        // secondary accent (greenish)
    accent: "#f59e0b",           // highlight color (orange/yellow)
    border: "#e5e7eb",           // subtle borders or dividers
    placeholder: "#9ca3af",      // input placeholders
    shadow: "#00000020",         // shadow color with opacity
    tabs: "#f9f9f9",
};

const darkTheme = {
    background: "#1f1f1f",       // main background
    card: "#3c4146ff",           // slightly lighter for cards
    primaryText: "#fafafa",      // primary text
    secondaryText: "#a78d8dff",  // gray text for subtitles
    primary: "#3b82f6",          // main accent
    secondary: "#10b981",        // secondary accent
    accent: "#f59e0b",           // highlight
    border: "#374151",           // subtle borders
    placeholder: "#6b7280",      // input placeholders
    shadow: "#00000060",         // stronger shadow for dark bg
    tabs: "#25282b",
};

export default function useTheme() {
    const [colorScheme, setColorScheme] = useState(Appearance.getColorScheme());

    useEffect(() => {
        const listener = ({ colorScheme }) => setColorScheme(colorScheme);
        const subscription = Appearance.addChangeListener(listener);

        return () => subscription.remove();
    }, []);

    const theme = colorScheme === "dark" ? darkTheme : lightTheme;

    return { theme, colorScheme };
}