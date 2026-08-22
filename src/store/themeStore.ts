import { DARK_COLORS, LIGHT_COLORS } from "@/constants/colors";
import { mmkvStorage } from "@/store/storage";
import { SurfaceId, SURFACE_THEMES, ThemeColors } from "@/types/theme.types";
import { Appearance } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type ThemeMode = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeState {
  themeMode: ThemeMode;
  theme: ThemeColors;
  resolvedTheme: ResolvedTheme;
  surface: SurfaceId;
  isReady: boolean;
  setTheme: (themeMode: ThemeMode) => void;
  setSurface: (id: SurfaceId) => void;
  applySystemTheme: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      themeMode: "system",
      theme: LIGHT_COLORS,
      resolvedTheme: "light",
      surface: "default",
      isReady: false,

      setTheme: (themeMode) => {
        const systemTheme = (Appearance.getColorScheme() || "light") as ResolvedTheme;
        const resolved: ResolvedTheme = themeMode === "system" ? systemTheme : themeMode;

        set({
          themeMode: themeMode,
          resolvedTheme: resolved,
          theme: SURFACE_THEMES[resolved][get().surface],
        });
      },

      setSurface: (id) =>
        set((state) => ({ surface: id, theme: SURFACE_THEMES[state.resolvedTheme][id] })),

      applySystemTheme: (isDark) => {
        const currentMode = get().themeMode;

        // Only apply if user selected 'system' mode
        if (currentMode === "system") {
          const resolved: ResolvedTheme = isDark ? "dark" : "light";
          set({
            resolvedTheme: resolved,
            theme: SURFACE_THEMES[resolved][get().surface],
          });
        }
      },
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        themeMode: state.themeMode,
        surface: state.surface
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Resolve theme based on persisted mode
          const systemTheme = (Appearance.getColorScheme() || "light") as ResolvedTheme;
          const resolved: ResolvedTheme = state.themeMode === "system" ? systemTheme : state.themeMode;
          // Set resolved theme and theme colors
          state.resolvedTheme = resolved;
          state.theme = resolved === "dark" ? DARK_COLORS : LIGHT_COLORS;

          // Apply saved surface, falling back if the key is gone
          if (state.surface !== "default") {
            const colors = SURFACE_THEMES[resolved][state.surface];
            if (colors) state.theme = colors;
            else state.surface = "default";
          }

          state.isReady = true;
        }
      },
    }
  )
);
