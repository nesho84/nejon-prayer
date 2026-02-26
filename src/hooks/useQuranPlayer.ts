import { getSurahAudioUrl } from "@/services/quranService";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

export function useQuranPlayer() {
  // Audio player
  const player = useAudioPlayer(null, {
    downloadFirst: true,
    updateInterval: 1000,
  });

  // Audio status
  const status = useAudioPlayerStatus(player);

  // Derived states
  const isPlaying = status.playing ?? false;
  const isBuffering = status.isBuffering ?? false;
  const hasFinished = status.didJustFinish ?? false;
  const currentTime = status.currentTime ?? 0;
  const duration = status.duration ?? 0;

  // Local state
  const [activeSound, setActiveSound] = useState<number | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState<boolean>(false);

  // Refs
  const appStateRef = useRef(AppState.currentState);

  // ------------------------------------------------------------
  // Configure expo-audio mode on mount (plays in silent mode, background playback)
  // ------------------------------------------------------------
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: "doNotMix",
        });
        console.log('✅ [qranPlayer] Audio mode configured for background playback');
      } catch (e) {
        console.warn('❌ [qranPlayer] Failed to set audio mode:', e);
      }
    };
    setupAudio();
  }, []);

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
  // Sync lock screen controls with app state
  // ------------------------------------------------------------
  useEffect(() => {
    // Sync when app comes to foreground
    const subscription = AppState.addEventListener('change', (state) => {
      if (appStateRef.current.match(/inactive|background/) && state === 'active') {
        player.setActiveForLockScreen(false);
      } else {
        // Set lock screen when app goes to background and audio is playing
        player.setActiveForLockScreen(true);
      }

      appStateRef.current = state;
    });

    return () => subscription.remove();
  }, [player]);

  // ------------------------------------------------------------
  // Clear switching flag when new audio starts
  // ------------------------------------------------------------
  useEffect(() => {
    if (isPlaying) {
      setIsSwitching(false);
    }
  }, [isPlaying]);

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