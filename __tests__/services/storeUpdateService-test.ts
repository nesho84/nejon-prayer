import { checkStoreUpdate } from '@/services/storeUpdateService';
import NetInfo from '@react-native-community/netinfo';
import * as ExpoInAppUpdates from 'expo-in-app-updates';

jest.mock('expo-in-app-updates', () => ({ checkForUpdate: jest.fn() }));
jest.mock('@react-native-community/netinfo', () => ({ fetch: jest.fn() }));

const checkForUpdate = ExpoInAppUpdates.checkForUpdate as jest.Mock;
const netInfoFetch = NetInfo.fetch as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  netInfoFetch.mockResolvedValue({ isConnected: true });
});

describe('checkStoreUpdate', () => {
  it('returns "available" when Play reports a newer version', async () => {
    checkForUpdate.mockResolvedValue({ updateAvailable: true });
    await expect(checkStoreUpdate()).resolves.toBe('available');
  });

  it('returns "available" offline too — Play knows it from its cache', async () => {
    checkForUpdate.mockResolvedValue({ updateAvailable: true });
    netInfoFetch.mockResolvedValue({ isConnected: false });
    await expect(checkStoreUpdate()).resolves.toBe('available');
  });

  it('returns "upToDate" when Play reports no update while online', async () => {
    checkForUpdate.mockResolvedValue({ updateAvailable: false });
    await expect(checkStoreUpdate()).resolves.toBe('upToDate');
  });

  it('returns "offline" when Play reports no update while offline', async () => {
    checkForUpdate.mockResolvedValue({ updateAvailable: false });
    netInfoFetch.mockResolvedValue({ isConnected: false });
    await expect(checkStoreUpdate()).resolves.toBe('offline');
  });

  it('throws when the check fails (e.g. ERROR_APP_NOT_OWNED)', async () => {
    checkForUpdate.mockRejectedValue(new Error('ERROR_APP_NOT_OWNED'));
    await expect(checkStoreUpdate()).rejects.toThrow('ERROR_APP_NOT_OWNED');
  });
});
