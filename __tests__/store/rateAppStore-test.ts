import { useRateAppStore } from '@/store/rateAppStore';

jest.mock('@/store/storage', () => ({
  mmkvStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

beforeEach(() => {
  useRateAppStore.setState({ rateAppNextShowAt: null, rateAppShownAt: null, rateAppShownCount: 0, rateAppDone: false });
});

describe('rateAppStore — setters', () => {
  it('starts with nothing recorded', () => {
    const state = useRateAppStore.getState();
    expect(state.rateAppNextShowAt).toBeNull();
    expect(state.rateAppShownAt).toBeNull();
    expect(state.rateAppShownCount).toBe(0);
    expect(state.rateAppDone).toBe(false);
  });

  it('stores and clears the next-show time', () => {
    useRateAppStore.getState().setRateAppNextShowAt(9999);
    expect(useRateAppStore.getState().rateAppNextShowAt).toBe(9999);
    useRateAppStore.getState().setRateAppNextShowAt(null);
    expect(useRateAppStore.getState().rateAppNextShowAt).toBeNull();
  });

  it('stores the shown timestamp and count', () => {
    useRateAppStore.getState().setRateAppShownAt(5678);
    useRateAppStore.getState().setRateAppShownCount(2);
    expect(useRateAppStore.getState().rateAppShownAt).toBe(5678);
    expect(useRateAppStore.getState().rateAppShownCount).toBe(2);
  });

  it('sets rateAppDone to true', () => {
    useRateAppStore.getState().setRateAppDone(true);
    expect(useRateAppStore.getState().rateAppDone).toBe(true);
  });
});
