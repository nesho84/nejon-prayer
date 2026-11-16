import { useOtaUpdatesSync } from '@/hooks/useOtaUpdatesSync';
import { renderHook } from '@testing-library/react-native';
import * as Updates from 'expo-updates';

jest.mock('expo-updates', () => ({
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
}));

const checkForUpdateAsync = Updates.checkForUpdateAsync as jest.Mock;
const fetchUpdateAsync = Updates.fetchUpdateAsync as jest.Mock;
const reloadAsync = Updates.reloadAsync as jest.Mock;

const flushMicrotasks = () => new Promise<void>((resolve) => setImmediate(resolve));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useOtaUpdatesSync — dev mode', () => {
  const originalDev = (globalThis as any).__DEV__;

  beforeEach(() => {
    (globalThis as any).__DEV__ = true;
  });

  afterEach(() => {
    (globalThis as any).__DEV__ = originalDev;
  });

  it('does not call the real OTA check', () => {
    renderHook(() => useOtaUpdatesSync());
    expect(checkForUpdateAsync).not.toHaveBeenCalled();
  });
});

describe('useOtaUpdatesSync — production mode', () => {
  const originalDev = (globalThis as any).__DEV__;

  beforeEach(() => {
    (globalThis as any).__DEV__ = false;
  });

  afterEach(() => {
    (globalThis as any).__DEV__ = originalDev;
  });

  it('fetches and reloads when an OTA update is available', async () => {
    checkForUpdateAsync.mockResolvedValueOnce({ isAvailable: true });
    renderHook(() => useOtaUpdatesSync());
    await flushMicrotasks();

    expect(fetchUpdateAsync).toHaveBeenCalledTimes(1);
    expect(reloadAsync).toHaveBeenCalledTimes(1);
  });

  it('does not fetch or reload when no OTA update is available', async () => {
    checkForUpdateAsync.mockResolvedValueOnce({ isAvailable: false });
    renderHook(() => useOtaUpdatesSync());
    await flushMicrotasks();

    expect(fetchUpdateAsync).not.toHaveBeenCalled();
    expect(reloadAsync).not.toHaveBeenCalled();
  });

  it('silently ignores an OTA check failure', async () => {
    checkForUpdateAsync.mockRejectedValueOnce(new Error('network down'));

    expect(() => renderHook(() => useOtaUpdatesSync())).not.toThrow();
    await flushMicrotasks();

    expect(fetchUpdateAsync).not.toHaveBeenCalled();
  });
});
