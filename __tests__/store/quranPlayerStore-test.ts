import { useQuranPlayerStore } from '@/store/quranPlayerStore';

beforeEach(() => {
  useQuranPlayerStore.setState({
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

describe('quranPlayerStore', () => {
  it('initialises with all playback fields off/null', () => {
    const s = useQuranPlayerStore.getState();
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
    useQuranPlayerStore.getState().syncPlayback({ isPlaying: true, activeSurahId: 5, activeSurahName: 'Al-Maidah' });
    const s = useQuranPlayerStore.getState();
    expect(s.isPlaying).toBe(true);
    expect(s.activeSurahId).toBe(5);
    expect(s.activeSurahName).toBe('Al-Maidah');
    // unrelated fields untouched
    expect(s.isBuffering).toBe(false);
    expect(s.hasFinished).toBe(false);
  });

  it('syncPlayback can set isSwitching and clear it', () => {
    useQuranPlayerStore.getState().syncPlayback({ isSwitching: true });
    expect(useQuranPlayerStore.getState().isSwitching).toBe(true);

    useQuranPlayerStore.getState().syncPlayback({ isSwitching: false });
    expect(useQuranPlayerStore.getState().isSwitching).toBe(false);
  });

  it('syncPlayback stores a playbackError', () => {
    const err = new Error('stream failed');
    useQuranPlayerStore.getState().syncPlayback({ playbackError: err });
    expect(useQuranPlayerStore.getState().playbackError).toBe(err);
  });

  it('syncPlayback can reset active surah', () => {
    useQuranPlayerStore.getState().syncPlayback({ activeSurahId: 2, activeSurahName: 'Al-Baqarah', isActive: true });
    useQuranPlayerStore.getState().syncPlayback({ isActive: false, activeSurahId: null, activeSurahName: null });
    const s = useQuranPlayerStore.getState();
    expect(s.isActive).toBe(false);
    expect(s.activeSurahId).toBeNull();
    expect(s.activeSurahName).toBeNull();
  });
});
