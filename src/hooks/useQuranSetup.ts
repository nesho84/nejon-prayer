import { addStatusListener, configureAudioMode } from "@/services/quranPlayerService";
import { useQuranPlayerStore } from "@/store/quranPlayerStore";
import { useQuranStore } from "@/store/quranStore";
import { useEffect } from "react";

export function useQuranSetup() {
  const loadFullQuran = useQuranStore((state) => state.loadFullQuran);
  const syncPlayback = useQuranPlayerStore((state) => state.syncPlayback);

  // ------------------------------------------------------------
  // Init: Load Full Quran from local JSON asset into store
  // Saves to Zustand store, never runs require() again
  // ------------------------------------------------------------
  useEffect(() => {
    requestAnimationFrame(() => {
      loadFullQuran();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------------------------------------
  // Init: Global audio mode — background playback + lock-screen association
  // Non-fatal: playback still works in foreground if this fails
  // ------------------------------------------------------------
  useEffect(() => {
    configureAudioMode().catch((err) => {
      console.error('❌ [useQuranSetup] Audio mode setup failed:', err);
    });
  }, []);

  // ------------------------------------------------------------
  // Status listener → store
  // Fires from anywhere: QuranScreen, lock screen, notification, background controls
  // Syncs playback state into the store for global access
  // ------------------------------------------------------------
  useEffect(() => {
    const subscription = addStatusListener((status) => {
      // Idle/stopped — handlers own the store reset; late ticks must not resurrect state
      if (useQuranPlayerStore.getState().activeSurahId === null) return;

      // The listener owns releasing isSwitching: the switch is only over once the player
      // reports playing (or fails) — the handler releasing it earlier flickers the row

      // Fires on network failure, bad audio URL, or stream interruption
      if (status.error) {
        console.error("❌ [useQuranSetup] Playback error:", status.error);
        syncPlayback({ playbackError: status.error, isPlaying: false, isBuffering: false, isSwitching: false });
        return;
      }

      // hasFinished is sticky — only a real playing tick (or the handlers) clears it
      if (status.didJustFinish) {
        syncPlayback({ isPlaying: false, isBuffering: false, hasFinished: true, isSwitching: false });
        return;
      }

      if (status.playing) {
        syncPlayback({ isPlaying: true, isBuffering: false, hasFinished: false, playbackError: null, isSwitching: false });
      } else {
        // A not-yet-loaded source counts as buffering (replaces RNTP's Loading state).
        // But a failed source stays unloaded forever — once an error is showing, don't let
        // !isLoaded resurrect the spinner (it also disables the retry button). The user's
        // retry clears playbackError and re-enters buffering.
        const hasError = useQuranPlayerStore.getState().playbackError !== null;
        syncPlayback({ isPlaying: false, isBuffering: !hasError && (status.isBuffering || !status.isLoaded) });
      }
    });

    return () => subscription.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
