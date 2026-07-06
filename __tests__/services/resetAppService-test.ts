import { cancelAllNotifications } from '@/services/notificationsService';
import { stopPlayback } from '@/services/quranPlayerService';
import { restoreDefaults } from '@/services/resetAppService';
import { storage } from '@/store/storage';
import * as Updates from 'expo-updates';

jest.mock('expo-updates', () => ({ isEnabled: true, reloadAsync: jest.fn() }));
jest.mock('@/services/quranPlayerService', () => ({ stopPlayback: jest.fn() }));
jest.mock('@/services/notificationsService', () => ({ cancelAllNotifications: jest.fn() }));
jest.mock('@/store/storage', () => ({ storage: { clearAll: jest.fn() } }));

const mockStopPlayback = stopPlayback as jest.Mock;
const mockCancelAllNotifications = cancelAllNotifications as jest.Mock;
const mockClearAll = storage.clearAll as jest.Mock;
const mockReloadAsync = Updates.reloadAsync as jest.Mock;

const ORIGINAL_DEV = (globalThis as any).__DEV__;

beforeEach(() => {
  jest.clearAllMocks();
  (globalThis as any).__DEV__ = false;
  (Updates as any).isEnabled = true;
  mockStopPlayback.mockResolvedValue(undefined);
  mockCancelAllNotifications.mockResolvedValue(undefined);
  mockClearAll.mockImplementation(() => undefined);
  mockReloadAsync.mockResolvedValue(undefined);
});

afterAll(() => {
  (globalThis as any).__DEV__ = ORIGINAL_DEV;
});

describe('restoreDefaults', () => {
  it('wipes and reloads on the happy path', async () => {
    const result = await restoreDefaults();

    expect(mockStopPlayback).toHaveBeenCalledTimes(1);
    expect(mockCancelAllNotifications).toHaveBeenCalledTimes(1);
    expect(mockClearAll).toHaveBeenCalledTimes(1);
    expect(mockReloadAsync).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: 'reloaded' });
  });

  it('returns wiped-no-reload in dev', async () => {
    (globalThis as any).__DEV__ = true;

    const result = await restoreDefaults();

    expect(mockClearAll).toHaveBeenCalledTimes(1);
    expect(mockReloadAsync).not.toHaveBeenCalled();
    expect(result).toEqual({ status: 'wiped-no-reload' });
  });

  it('returns wiped-no-reload when updates are disabled', async () => {
    // Mutating the already-imported Updates namespace doesn't propagate across the
    // module boundary (Babel's CJS interop copies it) — reset & re-mock instead.
    // resetModules() also clears the storage/audio-service mocks' module cache, so
    // re-require everything fresh within this isolated registry.
    jest.resetModules();
    jest.doMock('expo-updates', () => ({ isEnabled: false, reloadAsync: jest.fn() }));
    jest.doMock('@/services/quranPlayerService', () => ({ stopPlayback: jest.fn() }));
    jest.doMock('@/services/notificationsService', () => ({ cancelAllNotifications: jest.fn() }));
    jest.doMock('@/store/storage', () => ({ storage: { clearAll: jest.fn() } }));

    const { restoreDefaults: restoreDefaultsWithUpdatesDisabled } = require('@/services/resetAppService');
    const { storage: freshStorage } = require('@/store/storage');
    const { reloadAsync: freshReloadAsync } = require('expo-updates');

    const result = await restoreDefaultsWithUpdatesDisabled();

    expect(freshStorage.clearAll).toHaveBeenCalledTimes(1);
    expect(freshReloadAsync).not.toHaveBeenCalled();
    expect(result).toEqual({ status: 'wiped-no-reload' });
  });

  it('returns wiped-no-reload (not failed) when reload rejects after a successful wipe', async () => {
    mockReloadAsync.mockRejectedValue(new Error('network'));

    const result = await restoreDefaults();

    expect(mockClearAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: 'wiped-no-reload' });
  });

  it('returns failed and does not reload when clearAll throws', async () => {
    mockClearAll.mockImplementation(() => { throw new Error('mmkv'); });

    const result = await restoreDefaults();

    expect(mockReloadAsync).not.toHaveBeenCalled();
    expect(result).toEqual({ status: 'failed' });
  });

  it('still wipes and reloads when stopPlayback throws', async () => {
    mockStopPlayback.mockRejectedValue(new Error('native error'));

    const result = await restoreDefaults();

    expect(mockClearAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: 'reloaded' });
  });

  it('still wipes and reloads when cancelAllNotifications throws', async () => {
    mockCancelAllNotifications.mockRejectedValue(new Error('notifee error'));

    const result = await restoreDefaults();

    expect(mockClearAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: 'reloaded' });
  });
});
