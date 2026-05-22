jest.mock('@/store/storage', () => ({
  mmkvStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

import { useTesbihStore } from '@/store/tesbihStore';

const INITIAL_STATE = { count: 0, totalCount: 10, laps: 0 };

beforeEach(() => {
  useTesbihStore.setState(INITIAL_STATE);
});

describe('tesbihStore — setCount', () => {
  it('increments count by 1', () => {
    useTesbihStore.getState().setCount();
    expect(useTesbihStore.getState().count).toBe(1);
  });

  it('returns undefined when totalCount is not yet reached', () => {
    const result = useTesbihStore.getState().setCount();
    expect(result).toBeUndefined();
  });

  it('resets count to 0 and increments laps when totalCount is reached', () => {
    useTesbihStore.setState({ count: 9, totalCount: 10, laps: 0 });
    useTesbihStore.getState().setCount();
    expect(useTesbihStore.getState().count).toBe(0);
    expect(useTesbihStore.getState().laps).toBe(1);
  });

  it('returns true when totalCount is reached', () => {
    useTesbihStore.setState({ count: 9, totalCount: 10, laps: 0 });
    const result = useTesbihStore.getState().setCount();
    expect(result).toBe(true);
  });
});

describe('tesbihStore — reset', () => {
  it('resets count and laps to 0', () => {
    useTesbihStore.setState({ count: 5, laps: 2 });
    useTesbihStore.getState().reset();
    expect(useTesbihStore.getState().count).toBe(0);
    expect(useTesbihStore.getState().laps).toBe(0);
  });

  it('does not change totalCount', () => {
    useTesbihStore.setState({ totalCount: 33 });
    useTesbihStore.getState().reset();
    expect(useTesbihStore.getState().totalCount).toBe(33);
  });
});

describe('tesbihStore — setPreset', () => {
  it('sets totalCount to the given value', () => {
    useTesbihStore.getState().setPreset(33);
    expect(useTesbihStore.getState().totalCount).toBe(33);
  });

  it('resets count and laps', () => {
    useTesbihStore.setState({ count: 5, laps: 1 });
    useTesbihStore.getState().setPreset(99);
    expect(useTesbihStore.getState().count).toBe(0);
    expect(useTesbihStore.getState().laps).toBe(0);
  });
});

describe('tesbihStore — incrementTotal / decrementTotal', () => {
  it('increments totalCount by 1 and resets count and laps', () => {
    useTesbihStore.setState({ totalCount: 10, count: 3, laps: 1 });
    useTesbihStore.getState().incrementTotal();
    expect(useTesbihStore.getState().totalCount).toBe(11);
    expect(useTesbihStore.getState().count).toBe(0);
    expect(useTesbihStore.getState().laps).toBe(0);
  });

  it('decrements totalCount by 1 and resets count and laps', () => {
    useTesbihStore.setState({ totalCount: 10, count: 3, laps: 1 });
    useTesbihStore.getState().decrementTotal();
    expect(useTesbihStore.getState().totalCount).toBe(9);
    expect(useTesbihStore.getState().count).toBe(0);
    expect(useTesbihStore.getState().laps).toBe(0);
  });

  it('does not decrement totalCount below 1', () => {
    useTesbihStore.setState({ totalCount: 1 });
    useTesbihStore.getState().decrementTotal();
    expect(useTesbihStore.getState().totalCount).toBe(1);
  });
});
