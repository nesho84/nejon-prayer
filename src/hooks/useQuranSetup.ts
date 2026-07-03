import { useQuranPlayerStore } from "@/store/quranPlayerStore";
import { useQuranStore } from "@/store/quranStore";
import { useEffect } from "react";
import TrackPlayer, { AppKilledPlaybackBehavior, Capability, Event, State } from "react-native-track-player";

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
  }, []);

  // ------------------------------------------------------------
  // Init: Setup TrackPlayer + Sync active track on app start
  // Handles: previous session restore (user had audio, closed app, reopened)
  // ------------------------------------------------------------
  useEffect(() => {
    const setupAndSync = async () => {
      // Setup TrackPlayer once on mount
      try {
        await TrackPlayer.setupPlayer();
        await TrackPlayer.updateOptions({
          capabilities: [Capability.Play, Capability.Pause, Capability.Stop],
          android: {
            appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
            alwaysPauseOnInterruption: true,
          },
        });
      } catch (err: unknown) {
        // Ignore "already initialized" error
        if (err instanceof Error && err.message.includes('already been initialized')) {
          return;
        }
        console.error('❌ TrackPlayer setup failed:', err);
        return; // player not initialized — getActiveTrack/getPlaybackState would reject
      }

      // Sync active track (user started audio → left app → came back)
      const currentTrack = await TrackPlayer.getActiveTrack();
      const playerState = await TrackPlayer.getPlaybackState();
      const active = playerState.state !== State.None;
      const playing = playerState.state === State.Playing;

      if (currentTrack) {
        const surahId = parseInt(currentTrack.id.replace("surah-", ""));
        syncPlayback({
          activeSurahId: surahId,
          activeSurahName: currentTrack.title ?? null,
          isActive: active,
          isPlaying: playing,
          isBuffering: false,
          hasFinished: false,
        });
      }
    };
    setupAndSync();
  }, []);

  // ------------------------------------------------------------
  // Event listener → store
  // Fires from anywhere: QuranScreen, lock screen, notification, background controls
  // Syncs playback state into the store for global access
  // ------------------------------------------------------------
  useEffect(() => {
    const onStateChange = TrackPlayer.addEventListener(Event.PlaybackState, (event) => {
      switch (event.state) {
        case State.Playing:
          syncPlayback({ isActive: true, isPlaying: true, isBuffering: false, hasFinished: false, playbackError: null });
          break

        case State.Paused:
          syncPlayback({ isActive: true, isPlaying: false, isBuffering: false, hasFinished: false });
          break;

        case State.Buffering:
        case State.Loading:
          syncPlayback({ isActive: true, isPlaying: false, isBuffering: true, hasFinished: false });
          break;

        case State.Ended:
          syncPlayback({ isActive: true, isPlaying: false, isBuffering: false, hasFinished: true });
          break;

        case State.Stopped:
          // Player controller (QuranScreen) owns this — store already updated before this fires
          break;

        case State.None:
          syncPlayback({ isActive: false, isPlaying: false, isBuffering: false, hasFinished: false });
          break;
      }
    });

    // Fires on network failure, bad audio URL, or stream interruption
    const onError = TrackPlayer.addEventListener(Event.PlaybackError, (event) => {
      console.error("❌ TrackPlayer playback error:", event);
      syncPlayback({ playbackError: event, isPlaying: false, isBuffering: false });
    });

    return () => {
      onStateChange.remove();
      onError.remove();
    }
  }, []);
}