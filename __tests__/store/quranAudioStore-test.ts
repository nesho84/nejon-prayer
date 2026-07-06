import { useQuranAudioStore } from '@/store/quranAudioStore';

beforeEach(() => {
  useQuranAudioStore.setState({
    isActive: false,
    isPlaying: false,
    isBuffering: false,
    hasFinished: false,
    isSwitching: false,
    activeSurahId: null,
    activeSurahName: null,
    playbackError: null,
  });
});

describe('quranAudioStore', () => {
  it('initialises with all playback fields off/null', () => {
    const s = useQuranAudioStore.getState();
    expect(s.isActive).toBe(false);
    expect(s.isPlaying).toBe(false);
    expect(s.isBuffering).toBe(false);
    expect(s.hasFinished).toBe(false);
    expect(s.isSwitching).toBe(false);
    expect(s.activeSurahId).toBeNull();
    expect(s.activeSurahName).toBeNull();
    expect(s.playbackError).toBeNull();
  });

  it('syncPlayback merges partial state', () => {
    useQuranAudioStore.getState().syncPlayback({ isPlaying: true, activeSurahId: 5, activeSurahName: 'Al-Maidah' });
    const s = useQuranAudioStore.getState();
    expect(s.isPlaying).toBe(true);
    expect(s.activeSurahId).toBe(5);
    expect(s.activeSurahName).toBe('Al-Maidah');
    // unrelated fields untouched
    expect(s.isBuffering).toBe(false);
    expect(s.hasFinished).toBe(false);
  });

  it('syncPlayback can set isSwitching and clear it', () => {
    useQuranAudioStore.getState().syncPlayback({ isSwitching: true });
    expect(useQuranAudioStore.getState().isSwitching).toBe(true);

    useQuranAudioStore.getState().syncPlayback({ isSwitching: false });
    expect(useQuranAudioStore.getState().isSwitching).toBe(false);
  });

  it('syncPlayback stores a playbackError', () => {
    useQuranAudioStore.getState().syncPlayback({ playbackError: 'stream failed' });
    expect(useQuranAudioStore.getState().playbackError).toBe('stream failed');
  });

  it('syncPlayback can reset active surah', () => {
    useQuranAudioStore.getState().syncPlayback({ activeSurahId: 2, activeSurahName: 'Al-Baqarah', isActive: true });
    useQuranAudioStore.getState().syncPlayback({ isActive: false, activeSurahId: null, activeSurahName: null });
    const s = useQuranAudioStore.getState();
    expect(s.isActive).toBe(false);
    expect(s.activeSurahId).toBeNull();
    expect(s.activeSurahName).toBeNull();
  });
});
