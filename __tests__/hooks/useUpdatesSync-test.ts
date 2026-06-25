import { openUpdateAvailableModal } from '@/components/CheckForUpdate';
import { useDebugStore } from '@/debug/debugStore';
import { useUpdatesSync } from '@/hooks/useUpdatesSync';
import { renderHook } from '@testing-library/react-native';
import * as ExpoInAppUpdates from 'expo-in-app-updates';
import * as Updates from 'expo-updates';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('@/components/CheckForUpdate', () => ({ openUpdateAvailableModal: jest.fn() }));
jest.mock('expo-updates', () => ({
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
}));
jest.mock('expo-in-app-updates', () => ({ checkForUpdate: jest.fn() }));

const checkForUpdateAsync = Updates.checkForUpdateAsync as jest.Mock;
const fetchUpdateAsync = Updates.fetchUpdateAsync as jest.Mock;
const reloadAsync = Updates.reloadAsync as jest.Mock;
const checkForUpdate = ExpoInAppUpdates.checkForUpdate as jest.Mock;

const flushMicrotasks = () => new Promise<void>((resolve) => setImmediate(resolve));

beforeEach(() => {
  jest.clearAllMocks();
  useDebugStore.setState({ forceUpdateOnLaunch: false });
});

describe('useUpdatesSync — dev mode', () => {
  const originalDev = (globalThis as any).__DEV__;

  beforeEach(() => {
    (globalThis as any).__DEV__ = true;
  });

  afterEach(() => {
    (globalThis as any).__DEV__ = originalDev;
  });

  it('does not call openUpdateAvailableModal when forceUpdateOnLaunch is false', () => {
    renderHook(() => useUpdatesSync());
    expect(openUpdateAvailableModal).not.toHaveBeenCalled();
  });

  it('calls openUpdateAvailableModal when forceUpdateOnLaunch is true', () => {
    useDebugStore.setState({ forceUpdateOnLaunch: true });
    renderHook(() => useUpdatesSync());
    expect(openUpdateAvailableModal).toHaveBeenCalledTimes(1);
  });

  it('does not call the real OTA or store checks', () => {
    renderHook(() => useUpdatesSync());
    expect(checkForUpdateAsync).not.toHaveBeenCalled();
    expect(checkForUpdate).not.toHaveBeenCalled();
  });
});

describe('useUpdatesSync — production mode', () => {
  const originalDev = (globalThis as any).__DEV__;

  beforeEach(() => {
    (globalThis as any).__DEV__ = false;
  });

  afterEach(() => {
    (globalThis as any).__DEV__ = originalDev;
  });

  it('fetches and reloads when an OTA update is available', async () => {
    checkForUpdateAsync.mockResolvedValueOnce({ isAvailable: true });
    checkForUpdate.mockResolvedValueOnce({ updateAvailable: false });
    renderHook(() => useUpdatesSync());
    await flushMicrotasks();

    expect(fetchUpdateAsync).toHaveBeenCalledTimes(1);
    expect(reloadAsync).toHaveBeenCalledTimes(1);
  });

  it('does not fetch or reload when no OTA update is available', async () => {
    checkForUpdateAsync.mockResolvedValueOnce({ isAvailable: false });
    checkForUpdate.mockResolvedValueOnce({ updateAvailable: false });
    renderHook(() => useUpdatesSync());
    await flushMicrotasks();

    expect(fetchUpdateAsync).not.toHaveBeenCalled();
    expect(reloadAsync).not.toHaveBeenCalled();
  });

  it('silently ignores an OTA check failure', async () => {
    checkForUpdateAsync.mockRejectedValueOnce(new Error('network down'));
    checkForUpdate.mockResolvedValueOnce({ updateAvailable: false });

    expect(() => renderHook(() => useUpdatesSync())).not.toThrow();
    await flushMicrotasks();

    expect(fetchUpdateAsync).not.toHaveBeenCalled();
  });

  it('opens the update-available modal when a store update is available', async () => {
    checkForUpdateAsync.mockResolvedValueOnce({ isAvailable: false });
    checkForUpdate.mockResolvedValueOnce({ updateAvailable: true });
    renderHook(() => useUpdatesSync());
    await flushMicrotasks();

    expect(openUpdateAvailableModal).toHaveBeenCalledTimes(1);
  });

  it('does not open the modal when no store update is available', async () => {
    checkForUpdateAsync.mockResolvedValueOnce({ isAvailable: false });
    checkForUpdate.mockResolvedValueOnce({ updateAvailable: false });
    renderHook(() => useUpdatesSync());
    await flushMicrotasks();

    expect(openUpdateAvailableModal).not.toHaveBeenCalled();
  });

  it('silently ignores a store check failure (e.g. ERROR_APP_NOT_OWNED)', async () => {
    checkForUpdateAsync.mockResolvedValueOnce({ isAvailable: false });
    checkForUpdate.mockRejectedValueOnce(new Error('ERROR_APP_NOT_OWNED'));

    expect(() => renderHook(() => useUpdatesSync())).not.toThrow();
    await flushMicrotasks();

    expect(openUpdateAvailableModal).not.toHaveBeenCalled();
  });
});
