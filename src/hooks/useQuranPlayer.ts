import { getSurahAudioUrl } from "@/services/quranService";
import notifee, { AndroidImportance } from '@notifee/react-native';
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useCallback, useEffect, useState } from "react";

export function useQuranPlayer() {
  // Local state
  const [activeSound, setActiveSound] = useState<number | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState<boolean>(false);

  // Audio player
  const player = useAudioPlayer(null, {
    updateInterval: 1000, // Update status every 500ms for smoother progress
    downloadFirst: true,
  });

  const status = useAudioPlayerStatus(player);

  // Derived states
  const isPlaying = status.playing ?? false;
  const isBuffering = status.isBuffering ?? false;
  const hasFinished = status.didJustFinish ?? false;
  const currentTime = status.currentTime ?? 0;
  const duration = status.duration ?? 0;

  // ------------------------------------------------------------
  // Auto-play when new audio source is loaded
  // ------------------------------------------------------------
  useEffect(() => {
    if (!audioUrl) return;

    let mounted = true;

    const loadAndPlay = async () => {
      try {

        player.replace({ uri: audioUrl });
        if (mounted) {
          player.play();
        }
      } catch (e) {
        console.error("Audio load error:", e);
      }
    };

    loadAndPlay();

    return () => {
      mounted = false;
    };
  }, [audioUrl, player]);

  // ------------------------------------------------------------
  // Clear switching flag when new audio starts
  // ------------------------------------------------------------
  useEffect(() => {
    if (isPlaying) {
      setIsSwitching(false);
    }
  }, [isPlaying]);

  // ------------------------------------------------------------
  // Create notifee notification when audio starts playing
  // ------------------------------------------------------------
  useEffect(() => {
    if (isPlaying) {
      console.log(audioUrl);

      async function showNotification() {
        try {
          // Create a channel (required for Android)
          const channelId = await notifee.createChannel({
            id: 'quran-playback',
            name: 'Quran Playback',
            importance: AndroidImportance.HIGH,
          });
          // Create notification
          notifee.displayNotification({
            title: 'Playing Surah',
            body: `Surah (${activeSound})`, // @TODO: Add surah name here...
            data: { type: 'quran-play' },
            android: {
              channelId: channelId,
              asForegroundService: true,
              ongoing: true,
              smallIcon: 'ic_stat_prayer',
              pressAction: { id: 'default', launchActivity: 'default' },
            },
          });
        } catch (error) {
          console.error("Error displaying audio notification:", error);
        }
      }
      showNotification();
    } else {
      // Stop foreground service when not playing
      notifee.stopForegroundService();
    }
  }, [isPlaying, activeSound]);

  // ------------------------------------------------------------
  // Play/Pause/Replay handler
  // ------------------------------------------------------------
  const handlePlayPause = useCallback((surahNumber: number) => {
    // Same surah → toggle or replay
    if (activeSound === surahNumber) {
      if (hasFinished) {
        // replay from start
        player.replace({ uri: audioUrl! });
        player.play();
      } else if (isPlaying) {
        player.pause();
      } else {
        player.play();
      }
      return;
    }

    // Different surah → stop & load new
    setIsSwitching(true);
    player.pause();

    const newAudioUrl = getSurahAudioUrl(surahNumber);
    setActiveSound(surahNumber);
    setAudioUrl(newAudioUrl);
  }, [player, audioUrl, activeSound, isPlaying, hasFinished]);

  return {
    activeSound,
    isPlaying,
    isBuffering: isSwitching || isBuffering,
    hasFinished,
    currentTime: isSwitching ? 0 : currentTime,
    duration: isSwitching ? 0 : duration,
    handlePlayPause,
  };
}