import { TRANSLATIONS } from "@/constants/translations/translations";

export type Language = "en" | "de" | "fr" | "sq" | "bs" | "mk" | "tr" | "ar";

export type Translations = typeof TRANSLATIONS.en;

export const LANGUAGES = [
  { value: 'en' as Language, label: 'English', icon: '🇬🇧' },
  { value: 'de' as Language, label: 'Deutsch', icon: '🇩🇪' },
  { value: 'fr' as Language, label: 'Français', icon: '🇫🇷' },
  { value: 'sq' as Language, label: 'Shqip', icon: '🇦🇱' },
  { value: 'bs' as Language, label: 'Bosanski', icon: '🇧🇦' },
  { value: 'mk' as Language, label: 'Македонски', icon: '🇲🇰' },
  { value: 'tr' as Language, label: 'Türkçe', icon: '🇹🇷' },
  { value: 'ar' as Language, label: 'العربية', icon: '🇸🇦' },
];
