import TrackPlayer, { AppKilledPlaybackBehavior, Capability, Event } from 'react-native-track-player';

// ------------------------------------------------------------
// Playback Service for react-native-track-player
// Is registered in the root index.ts file
// This runs in the background and listens for remote events (play, pause, stop)
// ------------------------------------------------------------
export const TrackPlayerService = async () => {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());
};

// ------------------------------------------------------------
// Setup function to initialize TrackPlayer with desired options
// Should be called once when the app starts (e.g. in the root component)
// ------------------------------------------------------------
let isSetup = false;

export async function setupTrackPlayer() {
  if (isSetup) return;

  try {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.Stop,
      ],
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
        alwaysPauseOnInterruption: true,
      },
    });

    isSetup = true;
  } catch (err: any) {
    // Ignore "already initialized" error
    if (err?.message?.includes('already been initialized')) {
      isSetup = true;
      return;
    }
    console.error('❌ TrackPlayer setup failed:', err);
  }
}