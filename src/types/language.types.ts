import { TRANSLATIONS } from "@/constants/translations";

export type Language = "en" | "de" | "sq" | "tr" | "ar";

export type Translations = typeof TRANSLATIONS.en;

export const LANGUAGES = [
  { value: 'en' as Language, label: 'English', icon: '🇬🇧' },
  { value: 'de' as Language, label: 'Deutsch', icon: '🇩🇪' },
  { value: 'sq' as Language, label: 'Shqip', icon: '🇦🇱' },
  { value: 'tr' as Language, label: 'Türkçe', icon: '🇹🇷' },
  { value: 'ar' as Language, label: 'العربية', icon: '🇸🇦' },
];
