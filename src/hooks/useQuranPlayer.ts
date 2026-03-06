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
      const playing = playerState.state === State.Playing;
      if (currentTrack) {
        const surahNumber = parseInt(currentTrack.id.replace("surah-", ""));
        syncPlayback({
          activeSurahNumber: surahNumber,
          activeSurahName: currentTrack.title ?? null,
          isActive: playing,
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
      const playing = event.state === State.Playing;
      const stopped = event.state === State.None || event.state === State.Stopped || event.state === State.Ended;
      const finished = event.state === State.Ended;
      const buffering = event.state === State.Buffering;

      if (stopped) {
        syncPlayback({
          isActive: false,
          isPlaying: false,
          isBuffering: false,
          hasFinished: finished,
        });
        return;
      }

      if (playing) {
        syncPlayback({
          isActive: true,
          isPlaying: true,
          isBuffering: false,
          hasFinished: false,
        });
        return;
      }

      // State.Paused or State.Buffering — session exists but not playing
      syncPlayback({
        isActive: false,
        isPlaying: false,
        isBuffering: buffering,
        hasFinished: false,
      });
    });

    return () => subscription.remove();
  }, []);
}