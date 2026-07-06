import { AUDIO_EDITIONS, getSurahAudioUrl } from "@/services/quranService";
import { AudioPlayer, AudioStatus, createAudioPlayer, setAudioModeAsync } from "expo-audio";

// Lazy module-level singleton — the player must outlive any screen (background playback)
let player: AudioPlayer | null = null;

// ------------------------------------------------------------
// Player instance, created on first use (1s status update cadence)
// ------------------------------------------------------------
export function getQuranPlayer(): AudioPlayer {
    if (!player) {
        player = createAudioPlayer(null, { updateInterval: 1000 });
    }
    return player;
}

// ------------------------------------------------------------
// Global audio mode — 'doNotMix' is required for lock-screen association
// and pauses playback on interruptions (e.g. incoming calls)
// ------------------------------------------------------------
export async function configureAudioMode(): Promise<void> {
    await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: "doNotMix",
    });
}

// ------------------------------------------------------------
// Subscribe to playback status updates (state, progress, errors)
// ------------------------------------------------------------
export function addStatusListener(callback: (status: AudioStatus) => void): { remove: () => void } {
    return getQuranPlayer().addListener("playbackStatusUpdate", callback);
}

// ------------------------------------------------------------
// Whether a surah is currently loaded — never creates the player
// ------------------------------------------------------------
export function isSurahLoaded(): boolean {
    return player?.isLoaded ?? false;
}

// ------------------------------------------------------------
// Load and play a surah + take over the lock-screen/notification controls
// ------------------------------------------------------------
export async function playSurah(surahId: number, title: string): Promise<void> {
    const quranPlayer = getQuranPlayer();
    quranPlayer.replace({ uri: getSurahAudioUrl(surahId) });
    quranPlayer.play();
    quranPlayer.setActiveForLockScreen(true, { title, artist: AUDIO_EDITIONS.alafasy });
}

// ------------------------------------------------------------
// Pause / Resume / Replay current surah
// ------------------------------------------------------------
export function pausePlayback(): void {
    player?.pause();
}

export function resumePlayback(): void {
    player?.play();
}

export async function replayFromStart(): Promise<void> {
    if (!player) return;
    await player.seekTo(0);
    player.play();
}

// ------------------------------------------------------------
// Stop playback and release the lock-screen/notification controls
// No-op if the player was never created this session (e.g. app reset without audio)
// ------------------------------------------------------------
export async function stopPlayback(): Promise<void> {
    if (!player) return;
    player.pause();
    await player.seekTo(0);
    player.clearLockScreenControls();
}
