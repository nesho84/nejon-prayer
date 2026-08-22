import { DARK_COLORS, DARK_GREEN, DARK_NEUTRAL, DARK_WARM, LIGHT_COLORS, LIGHT_GREEN, LIGHT_NEUTRAL, LIGHT_WARM } from "@/constants/colors";

export type Theme = "light" | "dark" | "system";

export type ThemeColors = typeof LIGHT_COLORS | typeof DARK_COLORS;

export const THEMES = [
  { value: 'light' as Theme, label: 'Light', icon: '☀️' },
  { value: 'dark' as Theme, label: 'Dark', icon: '🌙' },
  { value: 'system' as Theme, label: 'System', icon: '⚙️' },
];

// Surface options — keys are persisted, don't rename
export const SURFACE_THEMES = {
  dark: { default: DARK_COLORS, neutral: DARK_NEUTRAL, warm: DARK_WARM, green: DARK_GREEN },
  light: { default: LIGHT_COLORS, neutral: LIGHT_NEUTRAL, warm: LIGHT_WARM, green: LIGHT_GREEN },
};

export type SurfaceId = keyof typeof SURFACE_THEMES.dark;
