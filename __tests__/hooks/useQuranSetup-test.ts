import { useQuranSetup } from '@/hooks/useQuranSetup';
import { useQuranStore } from '@/store/quranStore';
import { act, renderHook } from '@testing-library/react-native';
import TrackPlayer from 'react-native-track-player';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));

jest.mock('react-native-track-player', () => ({
  __esModule: true,
  default: {
    setupPlayer: jest.fn(() => Promise.resolve()),
    updateOptions: jest.fn(() => Promise.resolve()),
    getActiveTrack: jest.fn(() => Promise.resolve(null)),
    getPlaybackState: jest.fn(() => Promise.resolve({ state: 'none' })),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  AppKilledPlaybackBehavior: { StopPlaybackAndRemoveNotification: 'stop' },
  Capability: { Play: 'play', Pause: 'pause', Stop: 'stop' },
  Event: { PlaybackState: 'playback-state', PlaybackError: 'playback-error' },
  State: {
    None: 'none', Playing: 'playing', Paused: 'paused',
    Buffering: 'buffering', Loading: 'loading', Ended: 'ended', Stopped: 'stopped',
  },
}));

const mockSetupPlayer = TrackPlayer.setupPlayer as jest.Mock;
const mockGetActiveTrack = TrackPlayer.getActiveTrack as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockSetupPlayer.mockResolvedValue(undefined);
  mockGetActiveTrack.mockResolvedValue(null);
  (TrackPlayer.updateOptions as jest.Mock).mockResolvedValue(undefined);
  (TrackPlayer.getPlaybackState as jest.Mock).mockResolvedValue({ state: 'none' });
  useQuranStore.setState({ loadFullQuran: jest.fn() } as any);
});

describe('useQuranSetup — player setup', () => {
  it('syncs the active track after successful setup', async () => {
    renderHook(() => useQuranSetup());
    await act(async () => {});
    expect(mockGetActiveTrack).toHaveBeenCalled();
  });

  it('bails out when setup fails — no calls on an uninitialized player', async () => {
    mockSetupPlayer.mockRejectedValue(new Error('player exploded'));
    renderHook(() => useQuranSetup());
    await act(async () => {});
    expect(mockGetActiveTrack).not.toHaveBeenCalled();
  });

  it('bails out on the benign "already initialized" error too', async () => {
    mockSetupPlayer.mockRejectedValue(new Error('The player has already been initialized via setupPlayer.'));
    renderHook(() => useQuranSetup());
    await act(async () => {});
    expect(mockGetActiveTrack).not.toHaveBeenCalled();
  });
});
