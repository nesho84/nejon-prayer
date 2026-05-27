import { fetchAyahsFromApi, loadQuranTransliterationJson, QURAN_TEXT_EDITIONS } from "@/services/quranService";
import { useLanguageStore } from "@/store/languageStore";
import { mmkvStorage } from "@/store/storage";
import { Language } from "@/types/language.types";
import { Ayah, FavoriteAyah, Quran, Surah } from '@/types/quran.types';
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type QuranData = {
  quran: Quran | null;        // Full Quran with verses
  surahs: Surah[] | null;     // Derived — surah list, without verses
  quranError: unknown | null;
  isQuranReady: boolean;
}

type AyahsData = {
  ayahs: Ayah[] | null; // Ayahs from API
  isLoadingAyahs: boolean;
  ayahsError: unknown;
  // "Start/Continue Reading Card" data
  lastReadSurahId: number | null;
  lastReadSurahName: string | null;
  lastReadAyahId: number | null;
  // "Start/Continue Khatam Card" data
  lastKhatamSurahId: number | null;
  lastKhatamSurahName: string | null;
  lastKhatamAyahId: number | null;
  khatamCount: number;
}

type AyahFavoritesData = {
  favoriteAyahs: FavoriteAyah[];
}

type QuranSettings = {
  arabicFontSize: number;
  translationFontSize: number;
  selectedEditions: Record<string, string>;
}

interface QuranState extends QuranData, AyahsData, AyahFavoritesData, QuranSettings {
  // Quran actions
  loadFullQuran: () => void;
  getSurahById: (id: number) => Surah | undefined;
  // Ayahs actions
  fetchAyahs: (surahId: number) => Promise<void>;
  setLastRead: (surahId: number, surahName: string, ayahId: number) => void;
  setLastKhatam: (surahId: number, surahName: string, ayahId: number) => void;
  completeKhatam: () => void;
  resetKhatam: () => void;
  // Settings actions
  setQuranSettings: (settings: Partial<QuranSettings>) => void;
  // Favorites actions
  toggleAyahFavorite: (ayah: FavoriteAyah) => void;
  isAyahFavorite: (surahId: number, ayahId: number) => boolean;
}

const DEFAULT_EDITIONS: Record<string, string> = {
  en: QURAN_TEXT_EDITIONS.en.sahih,
  de: QURAN_TEXT_EDITIONS.de.bubenheim,
  fr: QURAN_TEXT_EDITIONS.fr.hamidullah,
  sq: QURAN_TEXT_EDITIONS.sq.ahmeti,
  bs: QURAN_TEXT_EDITIONS.bs.korkut,
  mk: QURAN_TEXT_EDITIONS.mk.sahih,
  tr: QURAN_TEXT_EDITIONS.tr.diyanet,
} satisfies Record<Exclude<Language, 'ar'>, string>;

export const useQuranStore = create<QuranState>()(
  persist(
    (set, get) => ({
      // Quran data
      quran: null,
      surahs: null,
      quranError: null,
      isQuranReady: false,

      // Ayahs data
      ayahs: null,
      isLoadingAyahs: false,
      ayahsError: null,
      // Last reading
      lastReadSurahId: null,
      lastReadSurahName: null,
      lastReadAyahId: null,
      // Khatam reading + count
      lastKhatamSurahId: null,
      lastKhatamSurahName: null,
      lastKhatamAyahId: null,
      khatamCount: 0,

      // Settings
      arabicFontSize: 19,
      translationFontSize: 15,
      selectedEditions: DEFAULT_EDITIONS,

      // Favorites
      favoriteAyahs: [],

      // Load full Quran once at app startup
      // Derives surahs list immediately — strips verses
      loadFullQuran: () => {
        try {
          const quran = loadQuranTransliterationJson();
          const surahs = quran.map(({ verses, ...surah }) => ({
            ...surah,
          }));
          set({ quran, surahs, quranError: null });
        } catch (err) {
          console.error("❌ Failed to load Quran JSON:", err);
          set({ quran: null, surahs: null, quranError: err });
        } finally {
          set({ isQuranReady: true });
        }
      },

      // Get single surah with verses — for details screen
      getSurahById: (id) => {
        return get().quran?.find((s) => s.id === id);
      },

      // Fetch ayahs for a surah from API in the selected language/edition
      fetchAyahs: async (surahId) => {
        const { language } = useLanguageStore.getState();

        // Arabic — already in local JSON, use getSurahById()
        // AyahsScreen reads verses directly from getSurahById() for Arabic
        if (language === "ar") return;

        // Use the stored edition, fall back to English if somehow missing
        const edition = get().selectedEditions[language] ?? QURAN_TEXT_EDITIONS.en.sahih;

        set({ isLoadingAyahs: true, ayahsError: null, ayahs: [] });
        try {
          const data = await fetchAyahsFromApi(surahId, edition);
          set({ ayahs: data });
        } catch (err) {
          console.error("❌ Failed to fetch ayahs:", err);
          set({ ayahsError: err });
        } finally {
          set({ isLoadingAyahs: false });
        }
      },

      // Set last read position
      setLastRead: (surahId, surahName, ayahId) => set({
        lastReadSurahId: surahId,
        lastReadSurahName: surahName,
        lastReadAyahId: ayahId,
      }),

      // Set khatam position
      setLastKhatam: (surahId, surahName, ayahId) => set({
        lastKhatamSurahId: surahId,
        lastKhatamSurahName: surahName,
        lastKhatamAyahId: ayahId,
      }),

      // Reset khatam position only — does not touch khatamCount
      resetKhatam: () => set({
        lastKhatamSurahId: null,
        lastKhatamSurahName: null,
        lastKhatamAyahId: null,
      }),

      // Increment khatam count + clear position (card shows "Start Khatam" for next round)
      completeKhatam: () => set((state) => ({
        khatamCount: state.khatamCount + 1,
        lastKhatamSurahId: null,
        lastKhatamSurahName: null,
        lastKhatamAyahId: null,
      })),

      // Update Quran settings (font sizes)
      setQuranSettings: (settings) => set(settings),

      // Toggle a favorite ayah (add if not present, remove if already saved)
      toggleAyahFavorite: (ayah) => {
        const current = get().favoriteAyahs;
        const exists = current.find((f) => f.surahId === ayah.surahId && f.ayahId === ayah.ayahId) !== undefined;
        set({
          favoriteAyahs: exists
            ? current.filter((f) => !(f.surahId === ayah.surahId && f.ayahId === ayah.ayahId))
            : [...current, ayah],
        });
      },

      // Check if a specific ayah is bookmarked
      isAyahFavorite: (surahId, ayahId) => {
        const current = get().favoriteAyahs;
        return current.find((f) => f.surahId === surahId && f.ayahId === ayahId) !== undefined;
      },
    }),
    {
      name: "quran-storage",
      storage: createJSONStorage(() => mmkvStorage),
      // Start with defaults, then layer in any user-saved preferences on top
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<QuranState>),
        selectedEditions: { ...DEFAULT_EDITIONS, ...((persisted as Partial<QuranState>)?.selectedEditions ?? {}) },
      }),
      // Persist reading/khatam positions, counts, and display settings
      // — everything else (player state, loaded data) starts fresh
      partialize: (state) => ({
        lastReadSurahId: state.lastReadSurahId,
        lastReadSurahName: state.lastReadSurahName,
        lastReadAyahId: state.lastReadAyahId,
        lastKhatamSurahId: state.lastKhatamSurahId,
        lastKhatamSurahName: state.lastKhatamSurahName,
        lastKhatamAyahId: state.lastKhatamAyahId,
        khatamCount: state.khatamCount,
        arabicFontSize: state.arabicFontSize,
        translationFontSize: state.translationFontSize,
        selectedEditions: state.selectedEditions,
        favoriteAyahs: state.favoriteAyahs,
      }),
    }
  )
);