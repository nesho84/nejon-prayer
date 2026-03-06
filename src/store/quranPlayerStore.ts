import { fetchAllSurahs, Surah } from "@/services/quranService";
import { create } from "zustand";

type QuranPlayerData = {
  surahs: Surah[];
  isLoading: boolean;
  error: unknown;
  isActive: boolean;
  isPlaying: boolean;
  isBuffering: boolean;
  hasFinished: boolean;
  isSwitching: boolean;
  activeSurahNumber: number | null;
  activeSurahName: string | null;
}

interface QuranPlayerState extends QuranPlayerData {
  fetchSurahs: () => Promise<void>;
  syncPlayback: (payload: Partial<QuranPlayerData>) => void;
}

export const useQuranPlayerStore = create<QuranPlayerState>()((set) => ({
  surahs: [],
  isLoading: false,
  error: null,
  isActive: false,
  isPlaying: false,
  isBuffering: false,
  hasFinished: false,
  isSwitching: false,
  activeSurahNumber: null,
  activeSurahName: null,

  // Fetch all surahs
  fetchSurahs: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchAllSurahs();
      set({ surahs: data });
    } catch (err) {
      console.error("❌ Failed to load surahs:", err);
      set({ error: err });
    } finally {
      set({ isLoading: false });
    }
  },

  // Sync any state fields from QuranScreen into the store
  // Accepts a partial payload — only passed fields are updated ('set' does a shallow merge by default)
  syncPlayback: (payload) => set(payload),
}));