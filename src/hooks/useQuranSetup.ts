import { addStatusListener, configureAudioMode } from "@/services/quranAudioService";
import { useQuranAudioStore } from "@/store/quranAudioStore";
import { useQuranStore } from "@/store/quranStore";
import { useEffect } from "react";

export function useQuranSetup() {
  const loadFullQuran = useQuranStore((state) => state.loadFullQuran);
  const syncPlayback = useQuranAudioStore((state) => state.syncPlayback);

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
      if (useQuranAudioStore.getState().activeSurahId === null) return;

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

      // isLoaded is required: during a switch ExoPlayer keeps reporting playing:true for the
      // OLD surah while the new source downloads. Without the guard those ticks land here and
      // wipe isBuffering, killing the spinner for the whole download (and any mid-stream stall).
      if (status.playing && status.isLoaded) {
        syncPlayback({ isPlaying: true, isBuffering: false, hasFinished: false, playbackError: null, isSwitching: false });
      } else {
        // !isLoaded must NOT feed the spinner: a torn-down player reports it too (media
        // notification dismissed → ExoPlayer idle) and no further ticks follow, so the spinner
        // would hang forever. A real load or stall sets isBuffering, which is enough on its own.
        // The error guard stays for iOS, where a failed item keeps reporting isBuffering.
        const hasError = useQuranAudioStore.getState().playbackError !== null;
        syncPlayback({ isPlaying: false, isBuffering: !hasError && status.isBuffering });
      }
    });

    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
