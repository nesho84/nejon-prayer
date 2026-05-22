jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

jest.mock('expo-location', () => ({
  hasServicesEnabledAsync: jest.fn(),
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
}));

jest.mock('react-native-notify-kit', () => ({
  __esModule: true,
  default: {
    getNotificationSettings: jest.fn(),
    isBatteryOptimizationEnabled: jest.fn(),
  },
  AuthorizationStatus: { AUTHORIZED: 1, DENIED: 0 },
  AndroidNotificationSetting: { ENABLED: 1, DISABLED: 0 },
}));

import { useDeviceSettingsStore } from '@/store/deviceSettingsStore';
import NetInfo from '@react-native-community/netinfo';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import notifee, { AndroidNotificationSetting, AuthorizationStatus } from 'react-native-notify-kit';

const mockHasServices = Location.hasServicesEnabledAsync as jest.Mock;
const mockNetInfo = NetInfo.fetch as jest.Mock;
const mockGetSettings = notifee.getNotificationSettings as jest.Mock;
const mockBatteryOpt = notifee.isBatteryOptimizationEnabled as jest.Mock;

beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => { });
});

beforeEach(() => {
  jest.clearAllMocks();
  useDeviceSettingsStore.setState({
    internetConnection: false,
    locationPermission: false,
    notificationPermission: false,
    alarmPermission: false,
    batteryOptimization: true,
    deviceSettingsError: null,
    isReady: false,
  });
});

describe('deviceSettingsStore — initial state', () => {
  it('starts with all permissions false and isReady false', () => {
    const s = useDeviceSettingsStore.getState();
    expect(s.internetConnection).toBe(false);
    expect(s.locationPermission).toBe(false);
    expect(s.notificationPermission).toBe(false);
    expect(s.isReady).toBe(false);
  });
});

describe('deviceSettingsStore — syncDeviceSettings', () => {
  it('skips sync and leaves isReady false on non-Android', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', writable: true, configurable: true });
    await useDeviceSettingsStore.getState().syncDeviceSettings();
    expect(useDeviceSettingsStore.getState().isReady).toBe(false);
    Object.defineProperty(Platform, 'OS', { value: 'android', writable: true, configurable: true });
  });

  it('sets all permissions and isReady after a successful sync', async () => {
    mockHasServices.mockResolvedValue(true);
    mockNetInfo.mockResolvedValue({ isConnected: true, isInternetReachable: true });
    mockGetSettings.mockResolvedValue({
      authorizationStatus: AuthorizationStatus.AUTHORIZED,
      android: { alarm: AndroidNotificationSetting.ENABLED },
    });
    mockBatteryOpt.mockResolvedValue(false);

    await useDeviceSettingsStore.getState().syncDeviceSettings();
    const s = useDeviceSettingsStore.getState();

    expect(s.locationPermission).toBe(true);
    expect(s.internetConnection).toBe(true);
    expect(s.notificationPermission).toBe(true);
    expect(s.alarmPermission).toBe(true);
    expect(s.batteryOptimization).toBe(false);
    expect(s.isReady).toBe(true);
  });

  it('correctly reflects denied permissions', async () => {
    mockHasServices.mockResolvedValue(false);
    mockNetInfo.mockResolvedValue({ isConnected: false, isInternetReachable: false });
    mockGetSettings.mockResolvedValue({
      authorizationStatus: AuthorizationStatus.DENIED,
      android: { alarm: AndroidNotificationSetting.DISABLED },
    });
    mockBatteryOpt.mockResolvedValue(true);

    await useDeviceSettingsStore.getState().syncDeviceSettings();
    const s = useDeviceSettingsStore.getState();

    expect(s.locationPermission).toBe(false);
    expect(s.internetConnection).toBe(false);
    expect(s.notificationPermission).toBe(false);
    expect(s.alarmPermission).toBe(false);
    expect(s.isReady).toBe(true);
  });

  it('sets deviceSettingsError and isReady on failure', async () => {
    mockHasServices.mockImplementation(() => { throw new Error('location unavailable'); });
    mockNetInfo.mockResolvedValue({ isConnected: true, isInternetReachable: true });
    mockGetSettings.mockResolvedValue({ authorizationStatus: AuthorizationStatus.AUTHORIZED, android: { alarm: AndroidNotificationSetting.ENABLED } });
    mockBatteryOpt.mockResolvedValue(false);

    await useDeviceSettingsStore.getState().syncDeviceSettings();
    const s = useDeviceSettingsStore.getState();

    expect(s.deviceSettingsError).toBe('location unavailable');
    expect(s.isReady).toBe(true);
  });
});
