import { create } from 'zustand';

// ------------------------------------------------------------
// Ephemeral debug-only store (NOT persisted — resets to OFF on
// app restart). Backs the Debug Panel toggles that force-show
// scenario-gated UI (holiday card, Friday badge, Quran now-playing)
// so they can be tested on demand. Defaults are all `false`, so
// production behavior is unchanged (the Debug Panel is dev-only).
// ------------------------------------------------------------

export type UpdatePreview = 'idle' | 'upToDate' | 'error';

interface DebugStore {
  forceHoliday: boolean;
  forceFriday: boolean;
  forceQuranPlaying: boolean;
  updatePreview: UpdatePreview;
  toggleHoliday: () => void;
  toggleFriday: () => void;
  toggleQuranPlaying: () => void;
  setUpdatePreview: (value: UpdatePreview) => void;
}

export const useDebugStore = create<DebugStore>((set) => ({
  forceHoliday: false,
  forceFriday: false,
  forceQuranPlaying: false,
  updatePreview: 'idle',
  toggleHoliday: () => set((s) => ({ forceHoliday: !s.forceHoliday })),
  toggleFriday: () => set((s) => ({ forceFriday: !s.forceFriday })),
  toggleQuranPlaying: () => set((s) => ({ forceQuranPlaying: !s.forceQuranPlaying })),
  setUpdatePreview: (value) => set({ updatePreview: value }),
}));
