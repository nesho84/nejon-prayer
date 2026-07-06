import type * as QuranAudioService from '@/services/quranAudioService';

// Shared fake player — the mock factory below closes over it ("mock" prefix allows this)
const mockPlayer = {
  isLoaded: false,
  play: jest.fn(),
  pause: jest.fn(),
  replace: jest.fn(),
  seekTo: jest.fn(() => Promise.resolve()),
  setActiveForLockScreen: jest.fn(),
  clearLockScreenControls: jest.fn(),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
};

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => mockPlayer),
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/services/quranService', () => ({
  AUDIO_EDITIONS: { alafasy: 'ar.alafasy' },
  getSurahAudioUrl: jest.fn((id: number) => `https://cdn.example.com/${id}.mp3`),
}));

// Fresh module registry per test — resets the service's lazy player singleton
let service: typeof QuranAudioService;
let createAudioPlayer: jest.Mock;
let setAudioModeAsync: jest.Mock;

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  mockPlayer.isLoaded = false;
  ({ createAudioPlayer, setAudioModeAsync } = require('expo-audio'));
  service = require('@/services/quranAudioService');
});

describe('quranAudioService', () => {
  it('creates the player once with a 1s status cadence', () => {
    const first = service.getQuranPlayer();
    const second = service.getQuranPlayer();
    expect(first).toBe(second);
    expect(createAudioPlayer).toHaveBeenCalledTimes(1);
    expect(createAudioPlayer).toHaveBeenCalledWith(null, { updateInterval: 1000 });
  });

  it('configures the global audio mode for background playback', async () => {
    await service.configureAudioMode();
    expect(setAudioModeAsync).toHaveBeenCalledWith({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });
  });

  it('playSurah replaces the source, plays, then takes over the lock screen', async () => {
    await service.playSurah(2, 'Al-Baqarah');

    expect(mockPlayer.replace).toHaveBeenCalledWith({ uri: 'https://cdn.example.com/2.mp3' });
    expect(mockPlayer.play).toHaveBeenCalledTimes(1);
    expect(mockPlayer.setActiveForLockScreen).toHaveBeenCalledWith(true, { title: 'Al-Baqarah', artist: 'ar.alafasy' });

    const order = (fn: jest.Mock) => fn.mock.invocationCallOrder[0];
    expect(order(mockPlayer.replace)).toBeLessThan(order(mockPlayer.play));
    expect(order(mockPlayer.play)).toBeLessThan(order(mockPlayer.setActiveForLockScreen));
  });

  it('stopPlayback pauses, rewinds, and clears the lock-screen controls', async () => {
    service.getQuranPlayer();
    await service.stopPlayback();

    expect(mockPlayer.pause).toHaveBeenCalledTimes(1);
    expect(mockPlayer.seekTo).toHaveBeenCalledWith(0);
    expect(mockPlayer.clearLockScreenControls).toHaveBeenCalledTimes(1);
  });

  it('stopPlayback is a no-op when the player was never created (app reset without audio)', async () => {
    await service.stopPlayback();

    expect(createAudioPlayer).not.toHaveBeenCalled();
    expect(mockPlayer.pause).not.toHaveBeenCalled();
  });

  it('isSurahLoaded reflects the player without creating it', () => {
    expect(service.isSurahLoaded()).toBe(false);
    expect(createAudioPlayer).not.toHaveBeenCalled();

    service.getQuranPlayer();
    mockPlayer.isLoaded = true;
    expect(service.isSurahLoaded()).toBe(true);
  });

  it('replayFromStart seeks to zero before playing', async () => {
    service.getQuranPlayer();
    await service.replayFromStart();

    expect(mockPlayer.seekTo).toHaveBeenCalledWith(0);
    const order = (fn: jest.Mock) => fn.mock.invocationCallOrder[0];
    expect(order(mockPlayer.seekTo)).toBeLessThan(order(mockPlayer.play));
  });

  it('subscribes status listeners to playbackStatusUpdate', () => {
    const callback = jest.fn();
    const subscription = service.addStatusListener(callback);

    expect(mockPlayer.addListener).toHaveBeenCalledWith('playbackStatusUpdate', callback);
    expect(typeof subscription.remove).toBe('function');
  });
});
