import { openRateAppModal, showRateAppModal } from '@/components/RateApp';
import { useFeedbackStore } from '@/store/feedbackStore';
import { useModalStore } from '@/store/modalStore';
import { useRateAppStore } from '@/store/rateAppStore';
import { openStoreListing } from '@/utils/system';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Platform } from 'react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('@/utils/system', () => ({ openStoreListing: jest.fn() }));
jest.mock('@/components/CelebrationFx', () => () => null);
jest.mock('@react-native-vector-icons/ionicons/static', () => {
  const React = require('react');
  return { Ionicons: ({ name }: any) => React.createElement('View', { testID: `icon-${name}` }) };
});
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { version: '2.3.5' } },
}));

const NOW = new Date('2026-10-12T12:00:00').getTime();
const DAY_MS = 24 * 60 * 60 * 1000;

const show = () => useModalStore.getState().show as jest.Mock;
const hide = () => useModalStore.getState().hide as jest.Mock;

// Renders the content of the modal that was shown, so its buttons can be pressed
const renderShownModal = () => render(show().mock.calls[0][0].component);

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
  Object.defineProperty(Platform, 'OS', { value: 'android', writable: true, configurable: true });
  useModalStore.setState({ show: jest.fn(), hide: jest.fn() } as any);
  useRateAppStore.setState({ rateAppDone: false, rateAppVersion: null, rateAppRemindAt: null, rateAppShownAt: null });
  useFeedbackStore.setState({ feedbackShownAt: null });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('openRateAppModal — when it shows', () => {
  it('shows a fullscreen modal that only its buttons can close', () => {
    openRateAppModal();

    expect(show()).toHaveBeenCalledTimes(1);
    expect(show().mock.calls[0][0]).toMatchObject({ type: 'fullscreen', dismissable: false });
  });

  it('does nothing on iOS', () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', writable: true, configurable: true });
    openRateAppModal();
    expect(show()).not.toHaveBeenCalled();
  });

  it('does nothing within 7 days of "Later"', () => {
    useRateAppStore.setState({ rateAppRemindAt: NOW + DAY_MS });
    openRateAppModal();
    expect(show()).not.toHaveBeenCalled();
  });

  it('shows again once the 7 days have passed', () => {
    useRateAppStore.setState({ rateAppRemindAt: NOW - 1 });
    openRateAppModal();
    expect(show()).toHaveBeenCalledTimes(1);
  });

  it('does nothing after "Open Store" on the same version', () => {
    useRateAppStore.setState({ rateAppVersion: '2.3.5' });
    openRateAppModal();
    expect(show()).not.toHaveBeenCalled();
  });

  it('never shows after "Already rated" — not even on a new version or after the wait', () => {
    useRateAppStore.setState({ rateAppDone: true, rateAppVersion: '2.3.4', rateAppRemindAt: NOW - 1 });
    openRateAppModal();
    expect(show()).not.toHaveBeenCalled();
  });
});

describe('openRateAppModal — after updating to a new version', () => {
  it('does not show on the first trigger and starts the 7-day wait', () => {
    useRateAppStore.setState({ rateAppVersion: '2.3.4' });
    openRateAppModal();

    expect(show()).not.toHaveBeenCalled();
    expect(useRateAppStore.getState().rateAppVersion).toBeNull();
    expect(useRateAppStore.getState().rateAppRemindAt).toBe(NOW + 7 * DAY_MS);
  });

  it('shows at a trigger after the 7-day wait', () => {
    useRateAppStore.setState({ rateAppVersion: '2.3.4' });
    openRateAppModal();
    jest.setSystemTime(NOW + 7 * DAY_MS + 1);
    openRateAppModal();

    expect(show()).toHaveBeenCalledTimes(1);
  });
});

describe('showRateAppModal', () => {
  it('shows with no checks — even on iOS and after "Already rated" — and "Later" still waits 7 days', () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', writable: true, configurable: true });
    useRateAppStore.setState({ rateAppDone: true, rateAppVersion: '2.3.5', rateAppRemindAt: NOW + DAY_MS });
    showRateAppModal();

    expect(show()).toHaveBeenCalledTimes(1);
    renderShownModal();
    fireEvent.press(screen.getByText('Later'));
    expect(useRateAppStore.getState().rateAppRemindAt).toBe(NOW + 7 * DAY_MS);
    expect(hide()).toHaveBeenCalledWith('later');
  });
});

describe('openRateAppModal — buttons', () => {
  beforeEach(() => {
    openRateAppModal();
    renderShownModal();
  });

  it('shows the title, message and three buttons', () => {
    expect(screen.getByText('Enjoying Nejon Prayer?')).toBeTruthy();
    expect(screen.getByText('Open Store')).toBeTruthy();
    expect(screen.getByText('Later')).toBeTruthy();
    expect(screen.getByText('Already rated')).toBeTruthy();
  });

  it('"Open Store" saves the version, closes and opens the store listing', () => {
    fireEvent.press(screen.getByText('Open Store'));

    expect(useRateAppStore.getState().rateAppVersion).toBe('2.3.5');
    expect(hide()).toHaveBeenCalledWith('openStore');
    expect(openStoreListing).toHaveBeenCalledTimes(1);
  });

  it('"Later" waits 7 days and closes', () => {
    fireEvent.press(screen.getByText('Later'));

    expect(useRateAppStore.getState().rateAppRemindAt).toBe(NOW + 7 * DAY_MS);
    expect(hide()).toHaveBeenCalledWith('later');
    expect(openStoreListing).not.toHaveBeenCalled();
  });

  it('"Already rated" stops it for good and closes', () => {
    fireEvent.press(screen.getByText('Already rated'));

    expect(useRateAppStore.getState().rateAppDone).toBe(true);
    expect(hide()).toHaveBeenCalledWith('alreadyRated');
    expect(openStoreListing).not.toHaveBeenCalled();
  });
});

describe('openRateAppModal — kept apart from the feedback modal', () => {
  it('shows as before when the feedback modal was never shown', () => {
    openRateAppModal();
    expect(show()).toHaveBeenCalledTimes(1);
  });

  it('does nothing within 14 days of the feedback modal', () => {
    useFeedbackStore.setState({ feedbackShownAt: NOW - 13 * DAY_MS });
    openRateAppModal();
    expect(show()).not.toHaveBeenCalled();
  });

  it('shows again once 14 days have passed since the feedback modal', () => {
    useFeedbackStore.setState({ feedbackShownAt: NOW - 14 * DAY_MS - 1 });
    openRateAppModal();
    expect(show()).toHaveBeenCalledTimes(1);
  });

  it('leaves its own state untouched when it skips', () => {
    useFeedbackStore.setState({ feedbackShownAt: NOW - DAY_MS });
    openRateAppModal();

    const { rateAppDone, rateAppVersion, rateAppRemindAt, rateAppShownAt } = useRateAppStore.getState();
    expect({ rateAppDone, rateAppVersion, rateAppRemindAt, rateAppShownAt }).toEqual({
      rateAppDone: false, rateAppVersion: null, rateAppRemindAt: null, rateAppShownAt: null,
    });
  });

  it('records when it was shown, so the feedback modal can keep its distance', () => {
    showRateAppModal();
    expect(useRateAppStore.getState().rateAppShownAt).toBe(NOW);
  });
});
