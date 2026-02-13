import { TRANSLATIONS } from "@/constants/translations";
import { Language } from "@/types/language.types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvStorage } from "@/store/storage";

interface LanguageState {
  language: Language;
  tr: typeof TRANSLATIONS.en;
  isReady: boolean;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: "en",
      tr: TRANSLATIONS.en,
      isReady: false,

      setLanguage: (language) => {
        set({ language: language, tr: TRANSLATIONS[language] });
      },
    }),
    {
      name: "language-storage",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        language: state.language
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.tr = TRANSLATIONS[state.language];
          state.isReady = true;
        }
      },
    }
  )
);