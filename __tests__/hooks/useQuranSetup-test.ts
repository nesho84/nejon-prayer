import { useQuranSetup } from '@/hooks/useQuranSetup';
import { addStatusListener, configureAudioMode } from '@/services/quranPlayerService';
import { useQuranPlayerStore } from '@/store/quranPlayerStore';
import { useQuranStore } from '@/store/quranStore';
import { act, renderHook } from '@testing-library/react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));

jest.mock('@/services/quranPlayerService', () => ({
  configureAudioMode: jest.fn(() => Promise.resolve()),
  addStatusListener: jest.fn(() => ({ remove: jest.fn() })),
}));

const mockConfigureAudioMode = configureAudioMode as jest.Mock;
const mockAddStatusListener = addStatusListener as jest.Mock;

// Minimal AudioStatus — only the fields the listener reads
const makeStatus = (overrides: object = {}) => ({
  playing: false, isBuffering: false, isLoaded: true, didJustFinish: false, error: null, ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockConfigureAudioMode.mockResolvedValue(undefined);
  mockAddStatusListener.mockReturnValue({ remove: jest.fn() });
  useQuranStore.setState({ loadFullQuran: jest.fn() } as any);
  useQuranPlayerStore.setState({
    isActive: false, isPlaying: false, isBuffering: false, hasFinished: false,
    isSwitching: false, activeSurahId: null, activeSurahName: null, playbackError: null,
  });
});

// Renders the hook and returns the captured status callback
async function renderWithListener() {
  const rendered = renderHook(() => useQuranSetup());
  await act(async () => {});
  return { ...rendered, cb: mockAddStatusListener.mock.calls[0][0] as (status: any) => void };
}

describe('useQuranSetup — audio setup', () => {
  it('configures the audio mode and attaches the status listener on mount', async () => {
    await renderWithListener();
    expect(mockConfigureAudioMode).toHaveBeenCalledTimes(1);
    expect(mockAddStatusListener).toHaveBeenCalledTimes(1);
  });

  it('still attaches the listener when audio mode setup fails', async () => {
    mockConfigureAudioMode.mockRejectedValue(new Error('native error'));
    await renderWithListener();
    expect(mockAddStatusListener).toHaveBeenCalledTimes(1);
  });

  it('removes the listener on unmount', async () => {
    const remove = jest.fn();
    mockAddStatusListener.mockReturnValue({ remove });
    const { unmount } = await renderWithListener();
    unmount();
    expect(remove).toHaveBeenCalledTimes(1);
  });
});

describe('useQuranSetup — status → store mapping', () => {
  it('ignores updates while no surah is active (late ticks must not resurrect state)', async () => {
    const { cb } = await renderWithListener();
    act(() => cb(makeStatus({ playing: true })));
    expect(useQuranPlayerStore.getState().isPlaying).toBe(false);
  });

  it('syncs a playing tick, clears hasFinished/playbackError, and releases the switching lock', async () => {
    const { cb } = await renderWithListener();
    useQuranPlayerStore.setState({ activeSurahId: 1, hasFinished: true, playbackError: 'old error', isSwitching: true });
    act(() => cb(makeStatus({ playing: true })));
    const s = useQuranPlayerStore.getState();
    expect(s.isPlaying).toBe(true);
    expect(s.hasFinished).toBe(false);
    expect(s.playbackError).toBeNull();
    expect(s.isSwitching).toBe(false);
  });

  it('maps a stalled buffering tick to isBuffering', async () => {
    const { cb } = await renderWithListener();
    useQuranPlayerStore.setState({ activeSurahId: 1, isPlaying: true });
    act(() => cb(makeStatus({ isBuffering: true })));
    const s = useQuranPlayerStore.getState();
    expect(s.isPlaying).toBe(false);
    expect(s.isBuffering).toBe(true);
  });

  it('treats a not-yet-loaded tick as buffering (no flicker between switch and playback)', async () => {
    const { cb } = await renderWithListener();
    useQuranPlayerStore.setState({ activeSurahId: 1, isBuffering: true });
    act(() => cb(makeStatus({ isLoaded: false })));
    expect(useQuranPlayerStore.getState().isBuffering).toBe(true);
  });

  it('keeps hasFinished sticky across a trailing paused tick', async () => {
    const { cb } = await renderWithListener();
    useQuranPlayerStore.setState({ activeSurahId: 1, isPlaying: true });
    act(() => cb(makeStatus({ didJustFinish: true })));
    expect(useQuranPlayerStore.getState().hasFinished).toBe(true);

    // Regression: the next 1s tick after the finish must not clear the replay state
    act(() => cb(makeStatus()));
    expect(useQuranPlayerStore.getState().hasFinished).toBe(true);
  });

  it('stores playback errors, drops the playing/buffering flags, and releases the switching lock', async () => {
    const { cb } = await renderWithListener();
    useQuranPlayerStore.setState({ activeSurahId: 1, isPlaying: true, isSwitching: true });
    act(() => cb(makeStatus({ error: 'stream failed' })));
    const s = useQuranPlayerStore.getState();
    expect(s.playbackError).toBe('stream failed');
    expect(s.isPlaying).toBe(false);
    expect(s.isBuffering).toBe(false);
    expect(s.isSwitching).toBe(false);
  });

  it('does not resurrect the spinner after an error when the dead source keeps reporting unloaded', async () => {
    const { cb } = await renderWithListener();
    useQuranPlayerStore.setState({ activeSurahId: 1 });
    // Airplane mode: error tick, then the failed source keeps emitting isLoaded:false ticks
    act(() => cb(makeStatus({ error: 'stream failed' })));
    act(() => cb(makeStatus({ isLoaded: false })));
    const s = useQuranPlayerStore.getState();
    expect(s.isBuffering).toBe(false);       // spinner must not come back (would disable retry)
    expect(s.playbackError).toBe('stream failed');
  });
});
