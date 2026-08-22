export const LIGHT_COLORS = {
    // Backgrounds
    bg: "#fafafa",
    bg2: "#f8faf8",
    bg3: "#f3f4f6",
    bg4: "#e5e7eb",

    // Typography
    text: "#111827",
    text2: "#374151",
    textSecondary: "#4b5563",
    textMuted: "#6b7280",

    // Brand
    primary: "#2563eb",
    secondary: "#0ea5e9",
    accent: "#d97706",
    accent2: "#e0ac2abd",
    accentLight: '#f59e0b26',
    highlight: "#22c55e",

    // Status
    danger: "#dc2626",
    success: "#16a34a",
    warning: "#facc15de",
    info: "#0284c7",
    pink: "#db2777",
    violet: "#7c3aed",
    brown: "#92400e",
    gray: "#808080",
    green: "#50C878",
    teal: "#0d9488",
    indigo: "#4f46e5",
    orange: "#ea580c",

    // Surfaces & Borders
    card: "#f3f3f3",
    card2: "#e9ecef",
    card3: "#dee2e6",
    borderCard: "#dde0e6ff",
    borderCard2: "#ced4da",
    borderCard3: "#adb5bd",
    border: "#dce0e6",
    divider: "#d1d5db",
    divider2: "#d3d7de",
    divider3: "#c8cbd3",
    handle: "#c6c6c6",
    statusbar: "#e6e6e6",
    placeholder: "#9ca3af",

    // Interactive
    iconActive: "#1a2130",
    iconInactive: "#a5aebc",
    link: "#2060e3",
    linkHover: "#1d4ed8",

    // Tabs
    tab: "#f9fafb",
    tabActive: "#3e4a5c",
    tabInactive: "#929aa6",
    tabDivider: "#ebecf0",
    tabActiveIndicator: "#1e5de0",

    // Overlays
    shadow: "#00000020",
    overlay: "#00000030",
    overlayLight: "#00000012",
    surfaceBg: "#d9dbde",
    pressed: "#0000001f",

    // Utility
    white: "#ffffff",
    black: "#000000",
    gold: "#d1a127",
    islamicGreen: "#009000",
    transparent: "transparent",
};

export const DARK_COLORS = {
    // Backgrounds
    bg: "#121212",
    bg2: "#1d1d1d",
    bg3: "#2a2a2a",
    bg4: "#374151",

    // Typography
    text: "#f3f4f6",
    text2: "#d1d5db",
    textSecondary: "#9ca3af",
    textMuted: "#6b7280",

    // Brand
    primary: "#3b82f6",
    secondary: "#38bdf8",
    accent: "#fbbe24e1",
    accent2: "#e0ac2abd",
    accentLight: '#f59e0b26',
    highlight: "#22c55e",

    // Status
    danger: "#f87171",
    success: "#4ade80",
    warning: "#fde047",
    info: "#60a5fa",
    pink: "#f472b6",
    violet: "#a78bfa",
    brown: "#d97706",
    gray: "#808080",
    green: "#009000",
    teal: "#2dd4bf",
    indigo: "#818cf8",
    orange: "#fb923c",

    // Surfaces & Borders
    card: "#1f2937",
    card2: "#2d3748",
    card3: "#3e4a5b",
    borderCard: "#2d3649",
    borderCard2: "#4a5568",
    borderCard3: "#4d5b6e",
    border: "#3d4a5e",
    divider: "#4b5563",
    divider2: "#2f3d50ff",
    divider3: "#1c232eff",
    handle: "#5d5d5d",
    statusbar: "transparent",
    placeholder: "#5c636e",

    // Interactive
    iconActive: "#ffffff",
    iconInactive: "#4e545e",
    link: "#5a9ff8",
    linkHover: "#93c5fd",

    // Tabs
    tab: "#1e1e1e",
    tabActive: "#edf0f3",
    tabInactive: "#a4adb8",
    tabDivider: "#232527ff",
    tabActiveIndicator: "#4286f7",

    // Overlays
    shadow: "#00000080",
    overlay: "#00000060",
    overlayLight: "#00000033",
    surfaceBg: "#2a3244",
    pressed: "#ffffff1f",

    // Utility
    white: "#ffffff",
    black: "#000000",
    gold: "#d1a127",
    islamicGreen: "#009000",
    transparent: "transparent",
};

// Surface variants
export const DARK_NEUTRAL = { ...DARK_COLORS, card: "#2b2b2b", card2: "#383838", card3: "#4a4a4a", borderCard: "#393939" };
export const DARK_WARM = { ...DARK_COLORS, card: "#312822", card2: "#413630", card3: "#57483e", borderCard: "#3f342c" };
export const DARK_GREEN = { ...DARK_COLORS, card: "#232f28", card2: "#303f36", card3: "#41564a", borderCard: "#2e3c33" };

export const LIGHT_NEUTRAL = { ...LIGHT_COLORS, card: "#e9eff8", card2: "#dde6f3", card3: "#cdd9ec", borderCard: "#d4dfef" };
export const LIGHT_WARM = { ...LIGHT_COLORS, card: "#f8f1e2", card2: "#f0e7d4", card3: "#e5d8bf", borderCard: "#e8dcc2" };
export const LIGHT_GREEN = { ...LIGHT_COLORS, card: "#e8f4ec", card2: "#d8ebde", card3: "#c9e0d1", borderCard: "#d3e6da" };
