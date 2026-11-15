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
  useModalStore.setState({ visible: false, show: jest.fn(), hide: jest.fn() } as any);
  useRateAppStore.setState({ rateAppNextShowAt: null, rateAppShownAt: null, rateAppShownCount: 0, rateAppDone: false });
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
    useRateAppStore.setState({ rateAppNextShowAt: NOW + DAY_MS });
    openRateAppModal();
    expect(show()).not.toHaveBeenCalled();
  });

  it('shows again once the 7 days have passed', () => {
    useRateAppStore.setState({ rateAppNextShowAt: NOW - 1 });
    openRateAppModal();
    expect(show()).toHaveBeenCalledTimes(1);
  });

  it('never shows once done ("Open Store", "Already rated", or the 3rd show) — not even after the wait', () => {
    useRateAppStore.setState({ rateAppDone: true, rateAppNextShowAt: NOW - 1 });
    openRateAppModal();
    expect(show()).not.toHaveBeenCalled();
  });

  it('yields when another modal is already open, leaving its state untouched', () => {
    useModalStore.setState({ visible: true });
    openRateAppModal();

    expect(show()).not.toHaveBeenCalled();
    expect(useRateAppStore.getState().rateAppShownCount).toBe(0);
  });

  it('the 3rd show marks it done, so it stops after 3 shows', () => {
    useRateAppStore.setState({ rateAppShownCount: 2 });
    openRateAppModal();
    expect(show()).toHaveBeenCalledTimes(1);
    expect(useRateAppStore.getState().rateAppDone).toBe(true);

    openRateAppModal();
    expect(show()).toHaveBeenCalledTimes(1);
  });
});

describe('showRateAppModal', () => {
  it('shows with no checks — even on iOS and after "Already rated" — and "Later" still waits 7 days', () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', writable: true, configurable: true });
    useRateAppStore.setState({ rateAppDone: true, rateAppNextShowAt: NOW + DAY_MS });
    showRateAppModal();

    expect(show()).toHaveBeenCalledTimes(1);
    renderShownModal();
    fireEvent.press(screen.getByText('Later'));
    expect(useRateAppStore.getState().rateAppNextShowAt).toBe(NOW + 7 * DAY_MS);
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

  it('"Open Store" stops it for good, closes and opens the store listing', () => {
    fireEvent.press(screen.getByText('Open Store'));

    expect(useRateAppStore.getState().rateAppDone).toBe(true);
    expect(hide()).toHaveBeenCalledWith('openStore');
    expect(openStoreListing).toHaveBeenCalledTimes(1);
  });

  it('"Later" waits 7 days and closes', () => {
    fireEvent.press(screen.getByText('Later'));

    expect(useRateAppStore.getState().rateAppNextShowAt).toBe(NOW + 7 * DAY_MS);
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

    const { rateAppNextShowAt, rateAppShownAt, rateAppShownCount, rateAppDone } = useRateAppStore.getState();
    expect({ rateAppNextShowAt, rateAppShownAt, rateAppShownCount, rateAppDone }).toEqual({
      rateAppNextShowAt: null, rateAppShownAt: null, rateAppShownCount: 0, rateAppDone: false,
    });
  });

  it('records when it was shown and counts it, so the feedback modal can keep its distance', () => {
    showRateAppModal();
    expect(useRateAppStore.getState().rateAppShownAt).toBe(NOW);
    expect(useRateAppStore.getState().rateAppShownCount).toBe(1);
  });
});

describe('showRateAppModal — from About', () => {
  beforeEach(() => {
    showRateAppModal(true);
    renderShownModal();
  });

  it('does not record the open', () => {
    expect(useRateAppStore.getState().rateAppShownAt).toBeNull();
    expect(useRateAppStore.getState().rateAppShownCount).toBe(0);
  });

  it('"Later" closes without starting a wait', () => {
    fireEvent.press(screen.getByText('Later'));

    expect(useRateAppStore.getState().rateAppNextShowAt).toBeNull();
    expect(hide()).toHaveBeenCalledWith('later');
  });

  it('"Open Store" still stops it for good', () => {
    fireEvent.press(screen.getByText('Open Store'));

    expect(useRateAppStore.getState().rateAppDone).toBe(true);
    expect(openStoreListing).toHaveBeenCalledTimes(1);
  });

  it('"Already rated" still stops it for good', () => {
    fireEvent.press(screen.getByText('Already rated'));
    expect(useRateAppStore.getState().rateAppDone).toBe(true);
  });
});
