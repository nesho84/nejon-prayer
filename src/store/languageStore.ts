import { GLOBAL_TR } from "@/constants/translations/global.tr";
import { mmkvStorage } from "@/store/storage";
import { Language, Translations } from "@/types/language.types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface LanguageState {
  language: Language;
  tr: Translations;
  isReady: boolean;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: "en",
      tr: GLOBAL_TR.en,
      isReady: false,

      setLanguage: (language) => {
        set({ language: language, tr: GLOBAL_TR[language] });
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
          state.tr = GLOBAL_TR[state.language];
          state.isReady = true;
        }
      },
    }
  )
);