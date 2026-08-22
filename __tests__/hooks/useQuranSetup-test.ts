import { useQuranSetup } from '@/hooks/useQuranSetup';
import { addStatusListener, configureAudioMode } from '@/services/quranAudioService';
import { useQuranAudioStore } from '@/store/quranAudioStore';
import { useQuranStore } from '@/store/quranStore';
import { act, renderHook } from '@testing-library/react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));

jest.mock('@/services/quranAudioService', () => ({
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
  useQuranAudioStore.setState({
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
    expect(useQuranAudioStore.getState().isPlaying).toBe(false);
  });

  it('syncs a playing tick, clears hasFinished/playbackError, and releases the switching lock', async () => {
    const { cb } = await renderWithListener();
    useQuranAudioStore.setState({ activeSurahId: 1, hasFinished: true, playbackError: 'old error', isSwitching: true });
    act(() => cb(makeStatus({ playing: true })));
    const s = useQuranAudioStore.getState();
    expect(s.isPlaying).toBe(true);
    expect(s.hasFinished).toBe(false);
    expect(s.playbackError).toBeNull();
    expect(s.isSwitching).toBe(false);
  });

  it('maps a stalled buffering tick to isBuffering', async () => {
    const { cb } = await renderWithListener();
    useQuranAudioStore.setState({ activeSurahId: 1, isPlaying: true });
    act(() => cb(makeStatus({ isBuffering: true })));
    const s = useQuranAudioStore.getState();
    expect(s.isPlaying).toBe(false);
    expect(s.isBuffering).toBe(true);
  });

  it('holds the spinner and the switching lock while the new surah downloads', async () => {
    const { cb } = await renderWithListener();
    useQuranAudioStore.setState({ activeSurahId: 2, isSwitching: true, isBuffering: true });
    // Android reports the *intended* play state during STATE_BUFFERING, so the old surah keeps
    // sending playing:true for the whole download. That tick must not land on the playing branch
    act(() => cb(makeStatus({ playing: true, isLoaded: false, isBuffering: true })));
    const s = useQuranAudioStore.getState();
    expect(s.isBuffering).toBe(true);
    expect(s.isSwitching).toBe(true);
    expect(s.isPlaying).toBe(false);
  });

  it('shows the spinner for a mid-stream stall outside a switch', async () => {
    const { cb } = await renderWithListener();
    useQuranAudioStore.setState({ activeSurahId: 1, isPlaying: true, isSwitching: false });
    // isBuffering alone drives the spinner here — the switching lock is not involved
    act(() => cb(makeStatus({ playing: true, isLoaded: false, isBuffering: true })));
    expect(useQuranAudioStore.getState().isBuffering).toBe(true);
  });

  it('maps a paused tick to a resting row (play icon, no spinner)', async () => {
    const { cb } = await renderWithListener();
    useQuranAudioStore.setState({ activeSurahId: 1, isPlaying: true });
    act(() => cb(makeStatus({ playing: false, isLoaded: true, isBuffering: false })));
    const s = useQuranAudioStore.getState();
    expect(s.isPlaying).toBe(false);
    expect(s.isBuffering).toBe(false);
  });

  it('clears the spinner when a torn-down player reports unloaded (media notification dismissed)', async () => {
    const { cb } = await renderWithListener();
    useQuranAudioStore.setState({ activeSurahId: 1, isPlaying: true });
    // ExoPlayer goes idle and stops ticking — a spinner here would never resolve
    act(() => cb(makeStatus({ isLoaded: false })));
    expect(useQuranAudioStore.getState().isBuffering).toBe(false);
  });

  it('keeps hasFinished sticky across a trailing paused tick', async () => {
    const { cb } = await renderWithListener();
    useQuranAudioStore.setState({ activeSurahId: 1, isPlaying: true });
    act(() => cb(makeStatus({ didJustFinish: true })));
    expect(useQuranAudioStore.getState().hasFinished).toBe(true);

    // Regression: the next 1s tick after the finish must not clear the replay state
    act(() => cb(makeStatus()));
    expect(useQuranAudioStore.getState().hasFinished).toBe(true);
  });

  it('stores playback errors, drops the playing/buffering flags, and releases the switching lock', async () => {
    const { cb } = await renderWithListener();
    useQuranAudioStore.setState({ activeSurahId: 1, isPlaying: true, isSwitching: true });
    act(() => cb(makeStatus({ error: 'stream failed' })));
    const s = useQuranAudioStore.getState();
    expect(s.playbackError).toBe('stream failed');
    expect(s.isPlaying).toBe(false);
    expect(s.isBuffering).toBe(false);
    expect(s.isSwitching).toBe(false);
  });

  it('does not resurrect the spinner after an error when the dead source keeps reporting unloaded', async () => {
    const { cb } = await renderWithListener();
    useQuranAudioStore.setState({ activeSurahId: 1 });
    // Airplane mode: error tick, then the failed source keeps emitting isLoaded:false ticks
    act(() => cb(makeStatus({ error: 'stream failed' })));
    act(() => cb(makeStatus({ isLoaded: false })));
    const s = useQuranAudioStore.getState();
    expect(s.isBuffering).toBe(false);       // spinner must not come back (would disable retry)
    expect(s.playbackError).toBe('stream failed');
  });
});
