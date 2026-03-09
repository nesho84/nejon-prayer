import { loadQuranTransliterationJson, Quran, Surah } from "@/services/quranService";
import { create } from "zustand";

type QuranData = {
  quran: Quran | null;    // Full Quran with verses — source of truth
  surahs: Surah[] | null; // Derived — surah list with firstVerse, without verses
  isQuranReady: boolean;  // True once Quran JSON is loaded into store
}

type QuranPlayerData = {
  error: unknown;
  isActive: boolean;
  isPlaying: boolean;
  isBuffering: boolean;
  hasFinished: boolean;
  isSwitching: boolean;
  activeSurahId: number | null;
  activeSurahName: string | null;
}

interface QuranState extends QuranData, QuranPlayerData {
  loadFullQuran: () => void;
  getSurahById: (id: number) => Surah | undefined;

  syncPlayback: (payload: Partial<QuranPlayerData>) => void;
}

export const useQuranStore = create<QuranState>()((set, get) => ({
  // Quran data
  quran: null,
  surahs: null,
  isQuranReady: false,

  // Player state
  error: null,
  isActive: false,
  isPlaying: false,
  isBuffering: false,
  hasFinished: false,
  isSwitching: false,
  activeSurahId: null,
  activeSurahName: null,

  // Load full Quran once at app startup
  // Derives surahs list immediately — strips verses, keeps firstVerse
  loadFullQuran: () => {
    try {
      const quran = loadQuranTransliterationJson();
      const surahs = quran.map(({ verses, ...surah }) => ({
        ...surah,
        firstVerse: verses?.[0],
      }));
      set({ quran, surahs });
    } catch (err) {
      console.error("❌ Failed to load Quran JSON:", err);
      set({ quran: null, surahs: null, error: err });
    } finally {
      set({ isQuranReady: true });
    }
  },

  // Get single surah with verses — for details screen
  getSurahById: (id) => {
    return get().quran?.find((s) => s.id === id);
  },

  // Sync any playback-related state fields into the store
  // Accepts a partial payload — only passed fields are updated (shallow merge)
  syncPlayback: (payload) => set(payload),
}));