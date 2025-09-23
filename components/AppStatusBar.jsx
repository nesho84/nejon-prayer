import { StatusBar } from "expo-status-bar";
import { useThemeContext } from "@/contexts/ThemeContext";

export default function AppStatusBar() {
    const { resolvedThemeName } = useThemeContext();

    const barStyle = resolvedThemeName === "dark" ? "light" : "dark";

    return <StatusBar style={barStyle} />;
}