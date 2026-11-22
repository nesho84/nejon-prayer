import Sound from 'react-native-sound';

// ------------------------------------------------------------
// Internal state
// ------------------------------------------------------------
let currentSound: Sound | null = null;

// ------------------------------------------------------------
// Detect if a file path is a remote URL
// ------------------------------------------------------------
function isRemoteUrl(file: string): boolean {
    return file.startsWith('http://') || file.startsWith('https://');
}

// ------------------------------------------------------------
// Start Sound
// ------------------------------------------------------------
export async function startSound(file: string, volume: number): Promise<void> {
    if (!file || volume <= 0) return;

    try {
        await stopSound();

        // Local bundle files use Sound.MAIN_BUNDLE
        // Remote URLs use undefined as the base path
        const basePath = isRemoteUrl(file) ? undefined : Sound.MAIN_BUNDLE;

        // Callbacks use this `sound`, not `currentSound`: stopSound() or a newer
        // startSound() can clear/replace `currentSound` before they fire.
        const sound: Sound = new Sound(file, basePath, (err: Error | null) => {
            if (err) {
                console.error('❌ [soundService] Failed to load:', err);
                if (currentSound === sound) currentSound = null;
                return;
            }

            // Stopped or replaced while loading — release() is a no-op before load, so release now
            if (currentSound !== sound) {
                sound.release();
                return;
            }

            sound.setVolume(volume);
            sound.setNumberOfLoops(0); // play once

            const duration = sound.getDuration();

            console.log(`🔊 [soundService] Playing "${file} ${duration.toFixed(2)}sec" at volume ${volume}`);

            sound.play((success: boolean) => {
                if (success) {
                    console.log('✅ [soundService] Finished playback');
                } else {
                    console.error('❌ [soundService] Playback failed');
                }
                if (currentSound === sound) stopSound();
            });
        });
        currentSound = sound;
    } catch (err) {
        console.error('❌ [soundService] Error starting:', err);
    }
}

// ------------------------------------------------------------
// Stop Sound
// ------------------------------------------------------------
export async function stopSound(): Promise<void> {
    const sound = currentSound;
    if (!sound) return;

    // Cleared synchronously so concurrent callers (e.g. several DISMISSED events) no-op
    currentSound = null;

    // release() stops playback natively (Android: MediaPlayer.reset/release, iOS: [player stop]),
    // so there's no stop() callback to wait for. Before load it's a no-op — the load callback handles that.
    sound.release();
    console.log('🔇 [soundService] Stopped & released');
}
