import Sound from 'react-native-sound';

// ------------------------------------------------------------
// Internal state
// ------------------------------------------------------------
let currentSound: Sound | null = null;

// ------------------------------------------------------------
// Start Sound
// ------------------------------------------------------------
export async function startSound(file: string, volume: number): Promise<void> {
    if (!file || volume <= 0) return;

    try {
        await stopSound();

        currentSound = new Sound(file, Sound.MAIN_BUNDLE, (err: Error | null) => {
            if (err) {
                console.error('❌ [Sound] Failed to load:', err);
                return;
            }

            currentSound!.setVolume(volume);
            currentSound!.setNumberOfLoops(0); // play once

            const duration = currentSound!.getDuration();

            console.log(`🔊 [Sound] Playing "${file} ${duration.toFixed(2)}sec" at volume ${volume}`);

            currentSound!.play((success: boolean) => {
                if (success) {
                    console.log('✅ [Sound] Finished playback');
                } else {
                    console.error('❌ [Sound] Playback failed');
                }
                stopSound();
            });
        });
    } catch (err) {
        console.error('❌ [Sound] Error starting:', err);
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
                console.log('🔇 [Sound] Stopped & released');
                resolve();
            });
        } else {
            resolve();
        }
    });
}
