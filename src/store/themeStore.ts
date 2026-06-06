import { DARK_COLORS, LIGHT_COLORS } from "@/constants/colors";
import { mmkvStorage } from "@/store/storage";
import { ThemeColors } from "@/types/theme.types";
import { Appearance } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type ThemeMode = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeState {
  themeMode: ThemeMode;
  theme: ThemeColors;
  resolvedTheme: ResolvedTheme;
  isReady: boolean;
  setTheme: (themeMode: ThemeMode) => void;
  applySystemTheme: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      themeMode: "system",
      theme: LIGHT_COLORS,
      resolvedTheme: "light",
      isReady: false,

      setTheme: (themeMode) => {
        const systemTheme = (Appearance.getColorScheme() || "light") as ResolvedTheme;
        const resolved: ResolvedTheme = themeMode === "system" ? systemTheme : themeMode;

        set({
          themeMode: themeMode,
          resolvedTheme: resolved,
          theme: resolved === "dark" ? DARK_COLORS : LIGHT_COLORS,
        });
      },

      applySystemTheme: (isDark) => {
        const currentMode = get().themeMode;

        // Only apply if user selected 'system' mode
        if (currentMode === "system") {
          const resolved: ResolvedTheme = isDark ? "dark" : "light";
          set({
            resolvedTheme: resolved,
            theme: isDark ? DARK_COLORS : LIGHT_COLORS,
          });
        }
      },
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        themeMode: state.themeMode
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Resolve theme based on persisted mode
          const systemTheme = (Appearance.getColorScheme() || "light") as ResolvedTheme;
          const resolved: ResolvedTheme = state.themeMode === "system" ? systemTheme : state.themeMode;
          // Set resolved theme and theme colors
          state.resolvedTheme = resolved;
          state.theme = resolved === "dark" ? DARK_COLORS : LIGHT_COLORS;

          state.isReady = true;
        }
      },
    }
  )
);