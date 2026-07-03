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


        currentSound = new Sound(file, basePath, (err: Error | null) => {
            if (err) {
                console.error('❌ [soundService] Failed to load:', err);
                return;
            }

            currentSound!.setVolume(volume);
            currentSound!.setNumberOfLoops(0); // play once

            const duration = currentSound!.getDuration();

            console.log(`🔊 [soundService] Playing "${file} ${duration.toFixed(2)}sec" at volume ${volume}`);

            currentSound!.play((success: boolean) => {
                if (success) {
                    console.log('✅ [soundService] Finished playback');
                } else {
                    console.error('❌ [soundService] Playback failed');
                }
                stopSound();
            });
        });
    } catch (err) {
        console.error('❌ [soundService] Error starting:', err);
    }
}

// ------------------------------------------------------------
// Stop Sound
// ------------------------------------------------------------
export async function stopSound(): Promise<void> {
    return new Promise<void>((resolve) => {
        if (currentSound) {
            currentSound.stop(() => {
                currentSound!.release();
                currentSound = null;
                console.log('🔇 [soundService] Stopped & released');
                resolve();
            });
        } else {
            resolve();
        }
    });
}
