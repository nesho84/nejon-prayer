import { openNotifReminderModal, showNotifReminderModal } from '@/components/NotifReminder';
import { useDeviceSettingsStore } from '@/store/deviceSettingsStore';
import { useModalStore } from '@/store/modalStore';
import { useNotifReminderStore } from '@/store/notifReminderStore';
import { openNotificationSettings } from '@/utils/system';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import notifee from 'react-native-notify-kit';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('@/utils/system', () => ({ openNotificationSettings: jest.fn() }));
jest.mock('expo-location', () => ({ hasServicesEnabledAsync: jest.fn() }));
jest.mock('@react-native-community/netinfo', () => ({ fetch: jest.fn() }));
jest.mock('react-native-notify-kit', () => ({
  __esModule: true,
  default: { requestPermission: jest.fn() },
  AuthorizationStatus: { AUTHORIZED: 1, DENIED: 0 },
  AndroidNotificationSetting: { ENABLED: 1, DISABLED: 0 },
}));
jest.mock('@react-native-vector-icons/material-design-icons/static', () => {
  const React = require('react');
  return { MaterialDesignIcons: ({ name }: any) => React.createElement('View', { testID: `icon-${name}` }) };
});

const NOW = new Date('2026-10-15T12:00:00').getTime();
const DAY_MS = 24 * 60 * 60 * 1000;

const show = () => useModalStore.getState().show as jest.Mock;
const hide = () => useModalStore.getState().hide as jest.Mock;
const requestPermission = notifee.requestPermission as jest.Mock;

// Renders the content of the modal that was shown, so its buttons can be pressed
const renderShownModal = () => render(show().mock.calls[0][0].component);

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
  jest.spyOn(Alert, 'alert').mockImplementation(() => { });
  useModalStore.setState({ visible: false, show: jest.fn(), hide: jest.fn() } as any);
  useDeviceSettingsStore.setState({ notificationPermission: false });
  useNotifReminderStore.setState({ notifReminderNextShowAt: NOW - 1, notifReminderShownAt: null, notifReminderShownCount: 0, notifReminderDone: false });
});

// Shows the modal and presses "Not now"
const showAndSkip = () => {
  (show() as jest.Mock).mockClear();
  openNotifReminderModal();
  const { unmount } = renderShownModal();
  fireEvent.press(screen.getByText('Not now'));
  unmount();
};

afterEach(() => {
  jest.useRealTimers();
});

describe('openNotifReminderModal — when it shows', () => {
  it('shows an alert modal that only its buttons can close', () => {
    openNotifReminderModal();

    expect(show()).toHaveBeenCalledTimes(1);
    expect(show().mock.calls[0][0]).toMatchObject({ type: 'alert', dismissable: false });
  });

  it('counts the show but does not record a wait just by showing', () => {
    openNotifReminderModal();
    expect(useNotifReminderStore.getState().notifReminderShownCount).toBe(1);
    expect(useNotifReminderStore.getState().notifReminderShownAt).toBe(NOW);
    expect(useNotifReminderStore.getState().notifReminderNextShowAt).toBe(NOW - 1);
  });

  it('does nothing when notifications are granted, and resets the wait, count and done', () => {
    useNotifReminderStore.setState({ notifReminderShownCount: 3, notifReminderDone: true });
    useDeviceSettingsStore.setState({ notificationPermission: true });
    openNotifReminderModal();

    expect(show()).not.toHaveBeenCalled();
    expect(useNotifReminderStore.getState().notifReminderNextShowAt).toBeNull();
    expect(useNotifReminderStore.getState().notifReminderShownCount).toBe(0);
    expect(useNotifReminderStore.getState().notifReminderDone).toBe(false);
  });

  it('yields when another modal is open, leaving the store untouched', () => {
    useModalStore.setState({ visible: true });
    useNotifReminderStore.setState({ notifReminderNextShowAt: null });
    openNotifReminderModal();

    expect(show()).not.toHaveBeenCalled();
    expect(useNotifReminderStore.getState().notifReminderNextShowAt).toBeNull();
  });

  it('first time seen off — does not show and starts the 3-day wait', () => {
    useNotifReminderStore.setState({ notifReminderNextShowAt: null });
    openNotifReminderModal();

    expect(show()).not.toHaveBeenCalled();
    expect(useNotifReminderStore.getState().notifReminderNextShowAt).toBe(NOW + 3 * DAY_MS);
  });

  it('does nothing while still waiting', () => {
    useNotifReminderStore.setState({ notifReminderNextShowAt: NOW + DAY_MS });
    openNotifReminderModal();
    expect(show()).not.toHaveBeenCalled();
  });

  it('starts over with the 3-day wait after granting and disabling again', () => {
    useNotifReminderStore.setState({ notifReminderShownCount: 3, notifReminderDone: true });
    useDeviceSettingsStore.setState({ notificationPermission: true });
    openNotifReminderModal();
    useDeviceSettingsStore.setState({ notificationPermission: false });
    openNotifReminderModal();

    expect(show()).not.toHaveBeenCalled();
    expect(useNotifReminderStore.getState().notifReminderNextShowAt).toBe(NOW + 3 * DAY_MS);
    expect(useNotifReminderStore.getState().notifReminderShownCount).toBe(0);
  });
});

describe('openNotifReminderModal — schedule', () => {
  it('1st close waits 7 days, 2nd close 14 days, 3rd show marks it done for good', () => {
    showAndSkip();
    expect(useNotifReminderStore.getState().notifReminderShownCount).toBe(1);
    expect(useNotifReminderStore.getState().notifReminderNextShowAt).toBe(NOW + 7 * DAY_MS);

    jest.setSystemTime(NOW + 7 * DAY_MS + 1);
    showAndSkip();
    expect(useNotifReminderStore.getState().notifReminderShownCount).toBe(2);
    expect(useNotifReminderStore.getState().notifReminderNextShowAt).toBe(NOW + 21 * DAY_MS + 1);
    expect(useNotifReminderStore.getState().notifReminderDone).toBe(false);

    jest.setSystemTime(NOW + 21 * DAY_MS + 2);
    showAndSkip();
    expect(useNotifReminderStore.getState().notifReminderShownCount).toBe(3);
    expect(useNotifReminderStore.getState().notifReminderDone).toBe(true);

    (show() as jest.Mock).mockClear();
    jest.setSystemTime(NOW + 365 * DAY_MS);
    openNotifReminderModal();
    expect(show()).not.toHaveBeenCalled();
  });

  it('does not show within 14 days of the 2nd close', () => {
    useNotifReminderStore.setState({ notifReminderShownCount: 1 });
    showAndSkip();
    (show() as jest.Mock).mockClear();

    jest.setSystemTime(NOW + 13 * DAY_MS);
    openNotifReminderModal();
    expect(show()).not.toHaveBeenCalled();
  });
});

describe('showNotifReminderModal', () => {
  it('shows with no checks — even when granted and done — and still counts the show', () => {
    useDeviceSettingsStore.setState({ notificationPermission: true });
    useNotifReminderStore.setState({ notifReminderNextShowAt: NOW + DAY_MS, notifReminderShownCount: 1, notifReminderDone: true });
    showNotifReminderModal();

    expect(show()).toHaveBeenCalledTimes(1);
    expect(useNotifReminderStore.getState().notifReminderShownCount).toBe(2);
    renderShownModal();
    fireEvent.press(screen.getByText('Not now'));
    expect(useNotifReminderStore.getState().notifReminderNextShowAt).toBe(NOW + 14 * DAY_MS);
  });
});

describe('openNotifReminderModal — content and buttons', () => {
  beforeEach(() => {
    openNotifReminderModal();
    renderShownModal();
  });

  it('shows the title, five benefits and two buttons', () => {
    expect(screen.getByText('Never miss a reminder')).toBeTruthy();
    expect(screen.getByText('Get notified at prayer time, or a few minutes before.')).toBeTruthy();
    expect(screen.getByText('Hear the Adhan of your choice.')).toBeTruthy();
    expect(screen.getByText("A reminder for Jumu'ah every Friday.")).toBeTruthy();
    expect(screen.getByText('A Daily Reminder with Quran verses and hadiths.')).toBeTruthy();
    expect(screen.getByText('Reminders for Islamic holidays.')).toBeTruthy();
    expect(screen.getByText('Enable notifications')).toBeTruthy();
    expect(screen.getByText('Not now')).toBeTruthy();
  });

  it('"Not now" waits 7 days and closes without asking for permission', () => {
    fireEvent.press(screen.getByText('Not now'));

    expect(useNotifReminderStore.getState().notifReminderShownCount).toBe(1);
    expect(useNotifReminderStore.getState().notifReminderNextShowAt).toBe(NOW + 7 * DAY_MS);
    expect(hide()).toHaveBeenCalledWith('notNow');
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it('"Enable" waits 7 days, closes and asks for permission — granted, no alert', async () => {
    requestPermission.mockResolvedValue({ authorizationStatus: 1 });
    await act(async () => {
      fireEvent.press(screen.getByText('Enable notifications'));
    });

    expect(useNotifReminderStore.getState().notifReminderShownCount).toBe(1);
    expect(useNotifReminderStore.getState().notifReminderNextShowAt).toBe(NOW + 7 * DAY_MS);
    expect(hide()).toHaveBeenCalledWith('enable');
    expect(requestPermission).toHaveBeenCalledTimes(1);
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('"Enable" when denied — offers system settings', async () => {
    requestPermission.mockResolvedValue({ authorizationStatus: 0 });
    await act(async () => {
      fireEvent.press(screen.getByText('Enable notifications'));
    });

    expect(Alert.alert).toHaveBeenCalledTimes(1);
    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
    buttons.find((b: any) => b.text === 'Open Settings').onPress();
    expect(openNotificationSettings).toHaveBeenCalledTimes(1);
  });
});
