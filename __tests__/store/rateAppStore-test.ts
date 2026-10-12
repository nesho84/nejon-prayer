import { useRateAppStore } from '@/store/rateAppStore';

jest.mock('@/store/storage', () => ({
  mmkvStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

beforeEach(() => {
  useRateAppStore.setState({ rateAppDone: false, rateAppVersion: null, rateAppRemindAt: null });
});

describe('rateAppStore — setRateAppDone', () => {
  it('starts with rateAppDone as false', () => {
    expect(useRateAppStore.getState().rateAppDone).toBe(false);
  });

  it('sets rateAppDone to true', () => {
    useRateAppStore.getState().setRateAppDone(true);
    expect(useRateAppStore.getState().rateAppDone).toBe(true);
  });
});

describe('rateAppStore — setRateAppVersion', () => {
  it('starts with rateAppVersion as null', () => {
    expect(useRateAppStore.getState().rateAppVersion).toBeNull();
  });

  it('stores the version', () => {
    useRateAppStore.getState().setRateAppVersion('2.3.5');
    expect(useRateAppStore.getState().rateAppVersion).toBe('2.3.5');
  });

  it('clears it back to null', () => {
    useRateAppStore.setState({ rateAppVersion: '2.3.5' });
    useRateAppStore.getState().setRateAppVersion(null);
    expect(useRateAppStore.getState().rateAppVersion).toBeNull();
  });
});

describe('rateAppStore — setRateAppRemindAt', () => {
  it('starts with rateAppRemindAt as null', () => {
    expect(useRateAppStore.getState().rateAppRemindAt).toBeNull();
  });

  it('stores the timestamp', () => {
    useRateAppStore.getState().setRateAppRemindAt(1234);
    expect(useRateAppStore.getState().rateAppRemindAt).toBe(1234);
  });
});
