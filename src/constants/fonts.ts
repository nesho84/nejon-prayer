import { Translations } from "@/types/language.types";

export type QuranFontKey = "system" | "uthmani" | "amiri";

export interface QuranFontDefinition {
  key: QuranFontKey;
  labelKey: keyof Translations["labels"];
  family: string | undefined;   // undefined => platform default
  sizeScale: number;            // multiplier on the user's chosen size
  lineHeightRatio: number;      // multiplier on the computed size
}

// ------------------------------------------------------------
// Quran ayah fonts — embedded at build time via the expo-font
// plugin in app.json. `family` must equal the file's PostScript
// name: Android resolves it from the filename, iOS from the name
// table, so the two only agree when they match.
// ------------------------------------------------------------
export const QURAN_FONTS: Record<QuranFontKey, QuranFontDefinition> = {
  system: {
    key: "system",
    labelKey: "quranFontSystem",
    family: undefined,
    sizeScale: 1.0,
    lineHeightRatio: 1.85, // current shipped ratio — do not change, it is the upgrade default
  },
  uthmani: {
    key: "uthmani",
    labelKey: "quranFontUthmani",
    family: "KFGQPCUthmanicScriptHAFS",
    sizeScale: 1.0,
    lineHeightRatio: 2.0,
  },
  amiri: {
    key: "amiri",
    labelKey: "quranFontAmiri",
    family: "Amiri-Regular",
    sizeScale: 1.15,
    lineHeightRatio: 2.1,
  },
};

export const DEFAULT_QURAN_FONT: QuranFontKey = "system";

// Every read goes through here — users persisted before this setting existed have undefined
export const getQuranFont = (key: QuranFontKey | undefined): QuranFontDefinition =>
  QURAN_FONTS[key ?? DEFAULT_QURAN_FONT] ?? QURAN_FONTS[DEFAULT_QURAN_FONT];
