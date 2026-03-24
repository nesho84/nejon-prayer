import { Ayah, fetchAyahsFromApi, loadQuranTransliterationJson, Quran, Surah } from "@/services/quranService";
import { useLanguageStore } from "@/store/languageStore";
import { mmkvStorage } from "@/store/storage";
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
  lastReadSurahId: number | null;
  lastReadSurahName: string | null;
  lastReadAyahId: number | null;
}

type QuranSettings = {
  arabicFontSize: number;
  translationFontSize: number;
}

type QuranPlayerData = {
  isActive: boolean;
  isPlaying: boolean;
  isBuffering: boolean;
  hasFinished: boolean;
  isSwitching: boolean;
  activeSurahId: number | null;
  activeSurahName: string | null;
  playbackError: unknown;
}

interface QuranState extends QuranData, AyahsData, QuranSettings, QuranPlayerData {
  // Quran actions
  loadFullQuran: () => void;
  getSurahById: (id: number) => Surah | undefined;
  // Ayahs actions
  fetchAyahs: (surahId: number) => Promise<void>;
  setLastRead: (surahId: number, surahName: string, ayahId: number) => void;
  // Settings actions
  setQuranSettings: (settings: Partial<QuranSettings>) => void;
  // Player actions
  syncPlayback: (payload: Partial<QuranPlayerData>) => void;
}

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
      lastReadSurahId: null,
      lastReadSurahName: null,
      lastReadAyahId: null,

      // Settings
      arabicFontSize: 26,
      translationFontSize: 18,

      // Player state
      isActive: false,
      isPlaying: false,
      isBuffering: false,
      hasFinished: false,
      isSwitching: false,
      activeSurahId: null,
      activeSurahName: null,
      playbackError: null,

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

        set({ isLoadingAyahs: true, ayahsError: null, ayahs: [] });
        try {
          const data = await fetchAyahsFromApi(surahId, language);
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

      // Update Quran settings (font sizes)
      setQuranSettings: (settings) => set(settings),

      // Sync any playback-related state fields into the store
      // Accepts a partial payload — only passed fields are updated (shallow merge)
      syncPlayback: (payload) => set(payload),
    }),
    {
      name: "quran-storage",
      storage: createJSONStorage(() => mmkvStorage),
      // Only last read persisted — everything else starts fresh
      partialize: (state) => ({
        lastReadSurahId: state.lastReadSurahId,
        lastReadSurahName: state.lastReadSurahName,
        lastReadAyahId: state.lastReadAyahId,
        arabicFontSize: state.arabicFontSize,
        translationFontSize: state.translationFontSize,
      }),
    }
  )
);