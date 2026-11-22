// Fake react-native-sound: the native load / play-finished callbacks are deferred
// and fired manually, so tests can interleave them like the real bridge does.
type Cb = (...args: any[]) => void;

class MockSound {
  static MAIN_BUNDLE = 'bundle';
  static instances: MockSound[] = [];

  loaded = false;
  released = 0;
  playing = false;
  onPlayEnd: Cb | null = null;
  onLoad: Cb;

  constructor(_file: string, _base: string | undefined, onLoad: Cb) {
    this.onLoad = onLoad;
    MockSound.instances.push(this);
  }

  // test helper
  finishLoad(err: Error | null = null) {
    this.loaded = err === null;
    this.onLoad(err);
  }

  // react-native-sound API surface used by soundService
  isLoaded() { return this.loaded; }
  setVolume() { return this; }
  setNumberOfLoops() { return this; }
  getDuration() { return 29.05; }
  play(cb: Cb) { this.playing = true; this.onPlayEnd = cb; return this; }
  // Like the real lib: calls back asynchronously, and only once loaded
  stop(cb?: Cb) {
    if (this.loaded) Promise.resolve().then(() => { this.playing = false; cb?.(); });
    return this;
  }
  // Like the real lib: release() is a no-op until loaded, and stops playback natively
  release() {
    if (this.loaded) { this.released++; this.loaded = false; this.playing = false; }
    return this;
  }
}

jest.mock('react-native-sound', () => ({ __esModule: true, default: MockSound }));

let startSound: typeof import('@/services/soundService').startSound;
let stopSound: typeof import('@/services/soundService').stopSound;

beforeEach(() => {
  jest.resetModules();
  MockSound.instances = [];
  ({ startSound, stopSound } = require('@/services/soundService'));
});

async function startLoaded(file = 'azan_short.mp3'): Promise<MockSound> {
  await startSound(file, 0.1);
  const sound = MockSound.instances.at(-1)!;
  sound.finishLoad();
  return sound;
}

describe('soundService', () => {
  it('plays once loaded', async () => {
    const sound = await startLoaded();
    expect(sound.playing).toBe(true);
  });

  it('stops and releases the playing sound', async () => {
    const sound = await startLoaded();

    await stopSound();

    expect(sound.playing).toBe(false);
    expect(sound.released).toBe(1);
  });

  it('concurrent stopSound calls (e.g. "clear all" dismissing several notifications) release once and do not throw', async () => {
    const sound = await startLoaded();

    await expect(
      Promise.all([stopSound(), stopSound(), stopSound(), stopSound(), stopSound()])
    ).resolves.toBeDefined();

    expect(sound.released).toBe(1);
  });

  it('stopSound during load resolves, and the sound is released once loaded instead of played', async () => {
    await startSound('azan_short.mp3', 0.1);
    const sound = MockSound.instances[0];

    await stopSound();

    sound.finishLoad();
    expect(sound.playing).toBe(false);
    expect(sound.released).toBe(1);
  });

  it('starting a new sound stops the one playing', async () => {
    const first = await startLoaded('azan_short.mp3');
    const second = await startLoaded('azan_full.mp3');

    expect(first.playing).toBe(false);
    expect(first.released).toBe(1);
    expect(second.playing).toBe(true);
  });

  it('a sound replaced while loading (fast preview taps) never plays', async () => {
    await startSound('azan_short.mp3', 0.1);
    await startSound('azan_full.mp3', 0.1);
    const [first, second] = MockSound.instances;

    second.finishLoad();
    first.finishLoad();

    expect(first.playing).toBe(false);
    expect(first.released).toBe(1);
    expect(second.playing).toBe(true);
  });

  it('a stale "finished" callback does not stop a newer sound', async () => {
    const first = await startLoaded('azan_short.mp3');
    const second = await startLoaded('azan_full.mp3');

    first.onPlayEnd!(true);

    expect(second.playing).toBe(true);
    expect(second.released).toBe(0);
  });

  it('clears the slot on load error so the next stopSound is a no-op', async () => {
    await startSound('missing.mp3', 0.1);
    MockSound.instances[0].finishLoad(new Error('not found'));

    await expect(stopSound()).resolves.toBeUndefined();
  });
});
