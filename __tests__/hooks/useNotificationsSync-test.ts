import { useNotificationsSync } from '@/hooks/useNotificationsSync';
import { useDeviceSettingsStore } from '@/store/deviceSettingsStore';
import { useHolidaysStore } from '@/store/holidaysStore';
import { useLanguageStore } from '@/store/languageStore';
import { useNotificationsStore } from '@/store/notificationsStore';
import { usePrayersStore } from '@/store/prayersStore';
import { renderHook } from '@testing-library/react-native';

jest.mock('@sentry/react-native', () => ({ captureException: jest.fn(), init: jest.fn() }));
jest.mock('@/services/notificationsService', () => ({
  createNotificationsChannels: jest.fn(() => Promise.resolve()),
  createNotificationCategories: jest.fn(() => Promise.resolve()),
  handleNotificationEvent: jest.fn(() => Promise.resolve()),
}));
jest.mock('react-native-notify-kit', () => ({
  __esModule: true,
  default: { onForegroundEvent: jest.fn(() => jest.fn()) },
  EventType: { ACTION_PRESS: 2 },
}));
jest.mock('@/store/deviceSettingsStore', () => ({ useDeviceSettingsStore: jest.fn() }));
jest.mock('@/store/notificationsStore', () => ({ useNotificationsStore: jest.fn() }));
jest.mock('@/store/prayersStore', () => ({ usePrayersStore: jest.fn() }));
jest.mock('@/store/prayersTrackingStore', () => ({ usePrayersTrackingStore: jest.fn() }));
jest.mock('@/store/holidaysStore', () => ({ useHolidaysStore: jest.fn() }));
jest.mock('@/store/languageStore', () => ({ useLanguageStore: jest.fn() }));

let deviceReady: boolean;
let notificationsReady: boolean;
let notificationPermission: boolean;
let mockSyncNotifications: jest.Mock;
let mockSetState: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  deviceReady = true;
  notificationsReady = true;
  notificationPermission = true;
  mockSyncNotifications = jest.fn();
  mockSetState = jest.fn();

  (useDeviceSettingsStore as unknown as jest.Mock).mockImplementation((selector: Function) =>
    selector({ isReady: deviceReady, notificationPermission })
  );
  (useNotificationsStore as unknown as jest.Mock).mockImplementation((selector: Function) =>
    selector({ isReady: notificationsReady })
  );
  (useNotificationsStore as unknown as { getState: jest.Mock }).getState = jest.fn(() => ({
    syncNotifications: mockSyncNotifications,
    notifSettings: {},
  }));
  (useNotificationsStore as unknown as { setState: jest.Mock }).setState = mockSetState;
  (usePrayersStore as unknown as jest.Mock).mockImplementation((selector: Function) =>
    selector({ prayerTimes: { Fajr: '04:32' } })
  );
  (useHolidaysStore as unknown as jest.Mock).mockImplementation((selector: Function) =>
    selector({ yearlyHolidays: null })
  );
  (useLanguageStore as unknown as jest.Mock).mockImplementation((selector: Function) =>
    selector({ language: 'en', tr: {} })
  );
});

describe('useNotificationsSync', () => {
  it('syncs and leaves the hash alone while notifications are permitted', () => {
    renderHook(() => useNotificationsSync());
    expect(mockSyncNotifications).toHaveBeenCalledTimes(1);
    expect(mockSetState).not.toHaveBeenCalled();
  });

  // Without the clear, re-enabling on the same day matches the stale hash and skips,
  // leaving the pre-disable DAILY triggers in place
  it('clears lastScheduledHash when notifications are denied', () => {
    notificationPermission = false;
    renderHook(() => useNotificationsSync());
    expect(mockSetState).toHaveBeenCalledWith({ lastScheduledHash: null });
    expect(mockSyncNotifications).not.toHaveBeenCalled();
  });

  it('does not clear the hash before the device settings are read', () => {
    notificationPermission = false;
    deviceReady = false;
    renderHook(() => useNotificationsSync());
    expect(mockSetState).not.toHaveBeenCalled();
  });

  it('does not clear the hash before the notifications store has rehydrated', () => {
    notificationPermission = false;
    notificationsReady = false;
    renderHook(() => useNotificationsSync());
    expect(mockSetState).not.toHaveBeenCalled();
  });

  it.todo('foreground notifee events need device integration — covered via notificationsService tests');
});
