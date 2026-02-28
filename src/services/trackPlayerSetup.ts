import TrackPlayer, { AppKilledPlaybackBehavior, Capability } from 'react-native-track-player';

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