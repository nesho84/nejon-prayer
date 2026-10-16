import { openNotifReminderModal } from '@/components/NotifReminder';
import { useNotifReminderSync } from '@/hooks/useNotifReminderSync';
import { useDeviceSettingsStore } from '@/store/deviceSettingsStore';
import { useNotifReminderStore } from '@/store/notifReminderStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { act, renderHook } from '@testing-library/react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('@/components/NotifReminder', () => ({ openNotifReminderModal: jest.fn() }));
jest.mock('expo-location', () => ({ hasServicesEnabledAsync: jest.fn() }));
jest.mock('@react-native-community/netinfo', () => ({ fetch: jest.fn() }));
jest.mock('react-native-notify-kit', () => ({
  __esModule: true,
  default: {},
  AuthorizationStatus: { AUTHORIZED: 1, DENIED: 0 },
  AndroidNotificationSetting: { ENABLED: 1, DISABLED: 0 },
}));

beforeEach(() => {
  jest.clearAllMocks();
  useOnboardingStore.setState({ onboardingComplete: true });
  useDeviceSettingsStore.setState({ isReady: true, notificationPermission: false });
  useNotifReminderStore.setState({ isReady: true });
});

describe('useNotifReminderSync', () => {
  it('opens the reminder once on mount when onboarding is done and device settings are ready', () => {
    renderHook(() => useNotifReminderSync());
    expect(openNotifReminderModal).toHaveBeenCalledTimes(1);
  });

  it('does nothing during onboarding', () => {
    useOnboardingStore.setState({ onboardingComplete: false });
    renderHook(() => useNotifReminderSync());
    expect(openNotifReminderModal).not.toHaveBeenCalled();
  });

  it('does nothing until device settings are ready', () => {
    useDeviceSettingsStore.setState({ isReady: false });
    renderHook(() => useNotifReminderSync());
    expect(openNotifReminderModal).not.toHaveBeenCalled();
  });

  it('does nothing until the reminder store has hydrated', () => {
    useNotifReminderStore.setState({ isReady: false });
    renderHook(() => useNotifReminderSync());
    expect(openNotifReminderModal).not.toHaveBeenCalled();
  });

  it('runs when onboarding completes', () => {
    useOnboardingStore.setState({ onboardingComplete: false });
    renderHook(() => useNotifReminderSync());
    act(() => useOnboardingStore.setState({ onboardingComplete: true }));
    expect(openNotifReminderModal).toHaveBeenCalledTimes(1);
  });

  it('runs again when the notification permission changes', () => {
    renderHook(() => useNotifReminderSync());
    act(() => useDeviceSettingsStore.setState({ notificationPermission: true }));
    act(() => useDeviceSettingsStore.setState({ notificationPermission: false }));
    expect(openNotifReminderModal).toHaveBeenCalledTimes(3);
  });
});
