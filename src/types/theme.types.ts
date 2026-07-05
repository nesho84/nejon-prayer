import { DARK_COLORS, LIGHT_COLORS } from "@/constants/colors";

export type Theme = "light" | "dark" | "system";

export type ThemeColors = typeof LIGHT_COLORS | typeof DARK_COLORS;

export const THEMES = [
  { value: 'light' as Theme, label: 'Light', icon: '☀️' },
  { value: 'dark' as Theme, label: 'Dark', icon: '🌙' },
  { value: 'system' as Theme, label: 'System', icon: '⚙️' },
];
