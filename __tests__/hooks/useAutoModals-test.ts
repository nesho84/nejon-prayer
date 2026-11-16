import { showFeedbackModal } from '@/components/FeedbackModal';
import { showNotifReminderModal } from '@/components/NotifReminderModal';
import { showUpdateModal } from '@/components/UpdateModal';
import { useDebugStore } from '@/debug/debugStore';
import {
  canShowFeedback,
  canShowNotifReminder,
  canShowRateApp,
  canShowUpdate,
  checkAutoModalsOnStart,
  useAutoModals,
} from '@/hooks/useAutoModals';
import { useAutoModalsStore } from '@/store/autoModalsStore';
import { useDeviceSettingsStore } from '@/store/deviceSettingsStore';
import { useModalStore } from '@/store/modalStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import NetInfo from '@react-native-community/netinfo';
import { act, renderHook } from '@testing-library/react-native';
import * as ExpoInAppUpdates from 'expo-in-app-updates';
import { Platform } from 'react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('@/components/UpdateModal', () => ({ showUpdateModal: jest.fn() }));
jest.mock('@/components/NotifReminderModal', () => ({ showNotifReminderModal: jest.fn() }));
jest.mock('@/components/FeedbackModal', () => ({ showFeedbackModal: jest.fn() }));
jest.mock('expo-in-app-updates', () => ({ checkForUpdate: jest.fn() }));
jest.mock('@react-native-community/netinfo', () => ({ fetch: jest.fn() }));
jest.mock('expo-location', () => ({ hasServicesEnabledAsync: jest.fn() }));
jest.mock('react-native-notify-kit', () => ({
  __esModule: true,
  default: {},
  AuthorizationStatus: { AUTHORIZED: 1, DENIED: 0 },
  AndroidNotificationSetting: { ENABLED: 1, DISABLED: 0 },
}));

const NOW = new Date('2026-11-16T12:00:00').getTime();
const DAY_MS = 24 * 60 * 60 * 1000;

const checkForUpdate = ExpoInAppUpdates.checkForUpdate as jest.Mock;
const netInfoFetch = NetInfo.fetch as jest.Mock;
const originalDev = (globalThis as any).__DEV__;

const RESET_DATA = {
  updateNextShowAt: null,
  updateShownAt: null,
  updateShownCount: 0,
  updateCheckedAt: null,
  updateCheckResult: null,
  notifReminderNextShowAt: null,
  notifReminderShownAt: null,
  notifReminderShownCount: 0,
  notifReminderDone: false,
  rateAppNextShowAt: null,
  rateAppShownAt: null,
  rateAppShownCount: 0,
  rateAppDone: false,
  feedbackNextShowAt: null,
  feedbackShownAt: null,
  feedbackShownCount: 0,
  feedbackDone: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
  (globalThis as any).__DEV__ = false;
  Object.defineProperty(Platform, 'OS', { value: 'android', writable: true, configurable: true });
  useAutoModalsStore.setState({ ...RESET_DATA, isReady: true });
  useModalStore.setState({ visible: false });
  useDeviceSettingsStore.setState({ notificationPermission: true, isReady: true });
  useOnboardingStore.setState({ onboardingComplete: true });
  useDebugStore.setState({ debugModeEnabled: false, forceUpdateOnLaunch: false });
  checkForUpdate.mockResolvedValue({ updateAvailable: false });
  netInfoFetch.mockResolvedValue({ isConnected: true });
});

afterEach(() => {
  jest.useRealTimers();
  (globalThis as any).__DEV__ = originalDev;
});

describe('canShowUpdate', () => {
  it('is due with no wait, and after the wait', () => {
    expect(canShowUpdate()).toBe(true);
    useAutoModalsStore.setState({ updateNextShowAt: NOW - 1 });
    expect(canShowUpdate()).toBe(true);
  });

  it('is not due during the 3-day wait', () => {
    useAutoModalsStore.setState({ updateNextShowAt: NOW + DAY_MS });
    expect(canShowUpdate()).toBe(false);
  });
});

describe('canShowNotifReminder', () => {
  beforeEach(() => {
    useDeviceSettingsStore.setState({ notificationPermission: false });
  });

  it('is due when notifications are off and the wait is over', () => {
    useAutoModalsStore.setState({ notifReminderNextShowAt: NOW - 1 });
    expect(canShowNotifReminder()).toBe(true);
  });

  it('is not due before the first wait was started, or while waiting', () => {
    expect(canShowNotifReminder()).toBe(false);
    useAutoModalsStore.setState({ notifReminderNextShowAt: NOW + DAY_MS });
    expect(canShowNotifReminder()).toBe(false);
  });

  it('is not due when granted or done', () => {
    useAutoModalsStore.setState({ notifReminderNextShowAt: NOW - 1, notifReminderDone: true });
    expect(canShowNotifReminder()).toBe(false);
    useAutoModalsStore.setState({ notifReminderDone: false });
    useDeviceSettingsStore.setState({ notificationPermission: true });
    expect(canShowNotifReminder()).toBe(false);
  });
});

describe('canShowRateApp', () => {
  it('is due right away — no first wait', () => {
    expect(canShowRateApp()).toBe(true);
  });

  it('is never due on iOS', () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', writable: true, configurable: true });
    expect(canShowRateApp()).toBe(false);
  });

  it('is not due within 7 days of "Later", and due after', () => {
    useAutoModalsStore.setState({ rateAppNextShowAt: NOW + DAY_MS });
    expect(canShowRateApp()).toBe(false);
    useAutoModalsStore.setState({ rateAppNextShowAt: NOW - 1 });
    expect(canShowRateApp()).toBe(true);
  });

  it('is never due once done', () => {
    useAutoModalsStore.setState({ rateAppDone: true });
    expect(canShowRateApp()).toBe(false);
  });

  it('keeps 7 days from the feedback modal', () => {
    useAutoModalsStore.setState({ feedbackShownAt: NOW - 6 * DAY_MS });
    expect(canShowRateApp()).toBe(false);
    useAutoModalsStore.setState({ feedbackShownAt: NOW - 7 * DAY_MS - 1 });
    expect(canShowRateApp()).toBe(true);
  });

  it('is not due while another modal is open', () => {
    useModalStore.setState({ visible: true });
    expect(canShowRateApp()).toBe(false);
  });
});

describe('canShowFeedback', () => {
  it('is not due before its first wait was started, or while waiting', () => {
    expect(canShowFeedback()).toBe(false);
    useAutoModalsStore.setState({ feedbackNextShowAt: NOW + DAY_MS });
    expect(canShowFeedback()).toBe(false);
  });

  it('is due after the wait', () => {
    useAutoModalsStore.setState({ feedbackNextShowAt: NOW - 1 });
    expect(canShowFeedback()).toBe(true);
  });

  it('is never due once done', () => {
    useAutoModalsStore.setState({ feedbackNextShowAt: NOW - 1, feedbackDone: true });
    expect(canShowFeedback()).toBe(false);
  });

  it('keeps 7 days from the Rate App modal', () => {
    useAutoModalsStore.setState({ feedbackNextShowAt: NOW - 1, rateAppShownAt: NOW - 6 * DAY_MS });
    expect(canShowFeedback()).toBe(false);
    useAutoModalsStore.setState({ rateAppShownAt: NOW - 7 * DAY_MS - 1 });
    expect(canShowFeedback()).toBe(true);
  });
});

describe('checkAutoModalsOnStart — Feedback first show', () => {
  it('sets the first Feedback show 7 days ahead, only once', async () => {
    await checkAutoModalsOnStart();
    expect(useAutoModalsStore.getState().feedbackNextShowAt).toBe(NOW + 7 * DAY_MS);
    expect(showFeedbackModal).not.toHaveBeenCalled();

    jest.setSystemTime(NOW + DAY_MS);
    await checkAutoModalsOnStart();
    expect(useAutoModalsStore.getState().feedbackNextShowAt).toBe(NOW + 7 * DAY_MS);
  });

  it('leaves a done feedback modal alone', async () => {
    useAutoModalsStore.setState({ feedbackDone: true });
    await checkAutoModalsOnStart();
    expect(useAutoModalsStore.getState().feedbackNextShowAt).toBeNull();
  });
});

describe('checkAutoModalsOnStart — store check', () => {
  it('shows the update modal when an update is available', async () => {
    checkForUpdate.mockResolvedValue({ updateAvailable: true });
    await checkAutoModalsOnStart();

    expect(showUpdateModal).toHaveBeenCalledTimes(1);
    expect(useAutoModalsStore.getState().updateCheckResult).toBe('available');
    expect(useAutoModalsStore.getState().updateCheckedAt).toBe(NOW);
  });

  it('skips the update modal during its 3-day wait', async () => {
    checkForUpdate.mockResolvedValue({ updateAvailable: true });
    useAutoModalsStore.setState({ updateNextShowAt: NOW + DAY_MS });
    await checkAutoModalsOnStart();

    expect(showUpdateModal).not.toHaveBeenCalled();
  });

  it('resets the update cycle when up to date and online', async () => {
    useAutoModalsStore.setState({ updateShownCount: 4, updateNextShowAt: NOW + DAY_MS });
    await checkAutoModalsOnStart();

    expect(useAutoModalsStore.getState().updateCheckResult).toBe('upToDate');
    expect(useAutoModalsStore.getState().updateShownCount).toBe(0);
    expect(useAutoModalsStore.getState().updateNextShowAt).toBeNull();
  });

  it('does not reset when Play says "no update" offline', async () => {
    netInfoFetch.mockResolvedValue({ isConnected: false });
    useAutoModalsStore.setState({ updateShownCount: 4, updateNextShowAt: NOW + DAY_MS });
    await checkAutoModalsOnStart();

    expect(useAutoModalsStore.getState().updateCheckResult).toBe('offline');
    expect(useAutoModalsStore.getState().updateShownCount).toBe(4);
  });

  it('does not reset when the check fails (sideloaded build, iOS) — and still shows the next modal', async () => {
    checkForUpdate.mockRejectedValue(new Error('ERROR_APP_NOT_OWNED'));
    useAutoModalsStore.setState({ updateShownCount: 4, feedbackNextShowAt: NOW - 1 });
    await checkAutoModalsOnStart();

    expect(useAutoModalsStore.getState().updateCheckResult).toBe('error');
    expect(useAutoModalsStore.getState().updateShownCount).toBe(4);
    expect(showFeedbackModal).toHaveBeenCalledTimes(1);
  });

  it('gives up after 5 s, moves on, and ignores a late answer', async () => {
    checkForUpdate.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ updateAvailable: true }), 10000)));
    useAutoModalsStore.setState({ feedbackNextShowAt: NOW - 1 });

    const launch = checkAutoModalsOnStart();
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    await launch;

    expect(useAutoModalsStore.getState().updateCheckResult).toBe('timeout');
    expect(showFeedbackModal).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    expect(showUpdateModal).not.toHaveBeenCalled();
  });

  it('skips the real check in dev builds', async () => {
    (globalThis as any).__DEV__ = true;
    await checkAutoModalsOnStart();

    expect(checkForUpdate).not.toHaveBeenCalled();
    expect(useAutoModalsStore.getState().updateCheckResult).toBeNull();
  });

  it('debug "Update on launch" fakes an available update without a check', async () => {
    (globalThis as any).__DEV__ = true;
    useDebugStore.setState({ debugModeEnabled: true, forceUpdateOnLaunch: true });
    await checkAutoModalsOnStart();

    expect(checkForUpdate).not.toHaveBeenCalled();
    expect(showUpdateModal).toHaveBeenCalledTimes(1);
  });

  it('ignores "Update on launch" when debug mode is off', async () => {
    (globalThis as any).__DEV__ = true;
    useDebugStore.setState({ forceUpdateOnLaunch: true });
    await checkAutoModalsOnStart();

    expect(showUpdateModal).not.toHaveBeenCalled();
  });
});

describe('checkAutoModalsOnStart — order', () => {
  beforeEach(() => {
    checkForUpdate.mockResolvedValue({ updateAvailable: true });
    useDeviceSettingsStore.setState({ notificationPermission: false });
    useAutoModalsStore.setState({ notifReminderNextShowAt: NOW - 1, feedbackNextShowAt: NOW - 1 });
  });

  it('Update comes first', async () => {
    await checkAutoModalsOnStart();

    expect(showUpdateModal).toHaveBeenCalledTimes(1);
    expect(showNotifReminderModal).not.toHaveBeenCalled();
    expect(showFeedbackModal).not.toHaveBeenCalled();
  });

  it('then the notif reminder', async () => {
    checkForUpdate.mockResolvedValue({ updateAvailable: false });
    await checkAutoModalsOnStart();

    expect(showNotifReminderModal).toHaveBeenCalledTimes(1);
    expect(showFeedbackModal).not.toHaveBeenCalled();
  });

  it('then feedback', async () => {
    checkForUpdate.mockResolvedValue({ updateAvailable: false });
    useDeviceSettingsStore.setState({ notificationPermission: true });
    await checkAutoModalsOnStart();

    expect(showFeedbackModal).toHaveBeenCalledTimes(1);
  });

  it('shows nothing when another modal is open (e.g. Rate App during the check)', async () => {
    useModalStore.setState({ visible: true });
    await checkAutoModalsOnStart();

    expect(showUpdateModal).not.toHaveBeenCalled();
    expect(showNotifReminderModal).not.toHaveBeenCalled();
    expect(showFeedbackModal).not.toHaveBeenCalled();
  });
});

describe('useAutoModals', () => {
  const flush = () => act(async () => {
    await Promise.resolve();
  });

  it('runs the startup check once, after onboarding and the first device-settings sync', async () => {
    useDeviceSettingsStore.setState({ isReady: false });
    useOnboardingStore.setState({ onboardingComplete: false });
    const { rerender } = renderHook(() => useAutoModals());
    await flush();
    expect(checkForUpdate).not.toHaveBeenCalled();

    act(() => {
      useOnboardingStore.setState({ onboardingComplete: true });
      useDeviceSettingsStore.setState({ isReady: true });
    });
    await flush();
    expect(checkForUpdate).toHaveBeenCalledTimes(1);
    expect(useAutoModalsStore.getState().feedbackNextShowAt).toBe(NOW + 7 * DAY_MS);

    // Debug "Show Onboarding Screen" and back
    act(() => {
      useOnboardingStore.setState({ onboardingComplete: false });
    });
    act(() => {
      useOnboardingStore.setState({ onboardingComplete: true });
    });
    rerender({});
    await flush();
    expect(checkForUpdate).toHaveBeenCalledTimes(1);
  });

  it('starts the 3-day wait when notifications are seen off', async () => {
    useDeviceSettingsStore.setState({ notificationPermission: false });
    renderHook(() => useAutoModals());
    await flush();

    expect(useAutoModalsStore.getState().notifReminderNextShowAt).toBe(NOW + 3 * DAY_MS);
    expect(showNotifReminderModal).not.toHaveBeenCalled();
  });

  it('resets the reminder when granted, and starts over when turned off again', async () => {
    useDeviceSettingsStore.setState({ notificationPermission: false });
    useAutoModalsStore.setState({ notifReminderNextShowAt: NOW + DAY_MS, notifReminderShownCount: 3, notifReminderDone: true });
    renderHook(() => useAutoModals());
    await flush();

    act(() => {
      useDeviceSettingsStore.setState({ notificationPermission: true });
    });
    expect(useAutoModalsStore.getState().notifReminderNextShowAt).toBeNull();
    expect(useAutoModalsStore.getState().notifReminderShownCount).toBe(0);
    expect(useAutoModalsStore.getState().notifReminderDone).toBe(false);

    jest.setSystemTime(NOW + DAY_MS);
    act(() => {
      useDeviceSettingsStore.setState({ notificationPermission: false });
    });
    expect(useAutoModalsStore.getState().notifReminderNextShowAt).toBe(NOW + 4 * DAY_MS);
    expect(showNotifReminderModal).not.toHaveBeenCalled();
  });

  it('does not start the reminder wait before the first device-settings sync', async () => {
    useDeviceSettingsStore.setState({ notificationPermission: false, isReady: false });
    renderHook(() => useAutoModals());
    await flush();

    expect(useAutoModalsStore.getState().notifReminderNextShowAt).toBeNull();
  });
});
