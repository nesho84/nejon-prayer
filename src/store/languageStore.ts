import { TRANSLATIONS } from "@/constants/translations";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type Language = keyof typeof TRANSLATIONS;

interface LanguageState {
  language: Language;
  tr: typeof TRANSLATIONS.en;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: "en",
      tr: TRANSLATIONS.en,

      setLanguage: (language) => set({ language: language, tr: TRANSLATIONS[language] }),
    }),
    {
      name: "language-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ language: state.language }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.tr = TRANSLATIONS[state.language];
        }
      },
    }
  )
);