import { useDebugStore } from '@/store/debugStore';

beforeEach(() => {
  useDebugStore.setState({ forceHoliday: false, forceFriday: false, forceQuranPlaying: false });
});

describe('debugStore — defaults', () => {
  it('all force flags start false', () => {
    const { forceHoliday, forceFriday, forceQuranPlaying } = useDebugStore.getState();
    expect(forceHoliday).toBe(false);
    expect(forceFriday).toBe(false);
    expect(forceQuranPlaying).toBe(false);
  });
});

describe('debugStore — toggles', () => {
  it('toggleHoliday flips forceHoliday and leaves others untouched', () => {
    useDebugStore.getState().toggleHoliday();
    expect(useDebugStore.getState().forceHoliday).toBe(true);
    expect(useDebugStore.getState().forceFriday).toBe(false);
    expect(useDebugStore.getState().forceQuranPlaying).toBe(false);

    useDebugStore.getState().toggleHoliday();
    expect(useDebugStore.getState().forceHoliday).toBe(false);
  });

  it('toggleFriday flips forceFriday', () => {
    useDebugStore.getState().toggleFriday();
    expect(useDebugStore.getState().forceFriday).toBe(true);
    useDebugStore.getState().toggleFriday();
    expect(useDebugStore.getState().forceFriday).toBe(false);
  });

  it('toggleQuranPlaying flips forceQuranPlaying', () => {
    useDebugStore.getState().toggleQuranPlaying();
    expect(useDebugStore.getState().forceQuranPlaying).toBe(true);
    useDebugStore.getState().toggleQuranPlaying();
    expect(useDebugStore.getState().forceQuranPlaying).toBe(false);
  });
});
