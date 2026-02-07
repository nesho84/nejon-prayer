import { useEffect } from "react";
import { Appearance, ColorSchemeName } from "react-native";
import { useThemeStore } from "@/store/themeStore";

export function useSystemThemeListener() {
  const themeMode = useThemeStore((state) => state.themeMode);
  const applySystemTheme = useThemeStore((state) => state.applySystemTheme);

  useEffect(() => {
    // Only set up listener if mode is 'system'
    if (themeMode !== "system") return;

    const listener = ({ colorScheme }: { colorScheme: ColorSchemeName }) => {
      const isDark = colorScheme === "dark";
      applySystemTheme(isDark);
    };

    const subscription = Appearance.addChangeListener(listener);

    return () => subscription.remove();
  }, [themeMode, applySystemTheme]);
}