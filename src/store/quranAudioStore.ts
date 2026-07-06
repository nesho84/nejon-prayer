import { create } from "zustand";

type QuranAudioData = {
  isActive: boolean;
  isPlaying: boolean;
  isBuffering: boolean;
  hasFinished: boolean;
  isSwitching: boolean;
  activeSurahId: number | null;
  activeSurahName: string | null;
  playbackError: string | null;
}

interface QuranAudioState extends QuranAudioData {
  syncPlayback: (payload: Partial<QuranAudioData>) => void;
}

export const useQuranAudioStore = create<QuranAudioState>()((set) => ({
  // Player state
  isActive: false,
  isPlaying: false,
  isBuffering: false,
  hasFinished: false,
  isSwitching: false,
  activeSurahId: null,
  activeSurahName: null,
  playbackError: null,

  // Sync any playback-related state fields into the store
  // Accepts a partial payload — only passed fields are updated (shallow merge)
  syncPlayback: (payload) => set(payload),
}));
