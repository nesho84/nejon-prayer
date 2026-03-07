import { useQuranPlayerStore } from "@/store/quranPlayerStore";
import { useEffect } from "react";
import TrackPlayer, { AppKilledPlaybackBehavior, Capability, Event, State } from "react-native-track-player";

export function useQuranPlayer() {
  const syncPlayback = useQuranPlayerStore((s) => s.syncPlayback);

  // ------------------------------------------------------------
  // Init: setup TrackPlayer and sync any existing session into the store
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
      } catch (err: any) {
        // Ignore "already initialized" error
        if (err?.message?.includes('already been initialized')) {
          return;
        }
        console.error('❌ TrackPlayer setup failed:', err);
      }

      // Sync active track (user started audio → left app → came back)
      const currentTrack = await TrackPlayer.getActiveTrack();
      const playerState = await TrackPlayer.getPlaybackState();
      const active = playerState.state !== State.None;
      const playing = playerState.state === State.Playing;

      if (currentTrack) {
        const surahNumber = parseInt(currentTrack.id.replace("surah-", ""));
        syncPlayback({
          activeSurahNumber: surahNumber,
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
    const subscription = TrackPlayer.addEventListener(Event.PlaybackState, (event) => {
      switch (event.state) {
        case State.Playing:
          syncPlayback({ isActive: true, isPlaying: true, isBuffering: false, hasFinished: false });
          break;

        case State.Paused:
          syncPlayback({ isActive: true, isPlaying: false, isBuffering: false, hasFinished: false });
          break;

        case State.Buffering:
          syncPlayback({ isActive: true, isPlaying: false, isBuffering: true, hasFinished: false });
          break;

        case State.Ended:
          syncPlayback({ isActive: true, isPlaying: false, isBuffering: false, hasFinished: true });
          break;

        case State.Stopped:
          // Player controller (QuranScreen) owns this.
          // Store is already updated before this fires, so we don't need to sync anything here
          break;

        case State.None:
          syncPlayback({ isActive: false, isPlaying: false, isBuffering: false, hasFinished: false });
          break;
      }
    });

    return () => subscription.remove();
  }, []);
}