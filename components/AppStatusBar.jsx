import { StatusBar } from "expo-status-bar";
import { useThemeContext } from "@/contexts/ThemeContext";

export default function AppStatusBar() {
    const { theme, resolvedThemeName } = useThemeContext();

    const barStyle = resolvedThemeName === "dark" ? "light" : "dark";

    return <StatusBar style={barStyle} />;
}