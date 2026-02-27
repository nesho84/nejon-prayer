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
  } catch (error) {
    // Ignoring Error:
    // Error: The player has already been initialized via setupPlayer.
  }
}