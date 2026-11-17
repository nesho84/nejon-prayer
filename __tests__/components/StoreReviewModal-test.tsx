import { showStoreReviewModal } from '@/components/StoreReviewModal';
import { useAutoModalsStore } from '@/store/autoModalsStore';
import { useModalStore } from '@/store/modalStore';
import { openStoreListing } from '@/utils/system';
import { fireEvent, render, screen } from '@testing-library/react-native';

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
  useModalStore.setState({ visible: false, show: jest.fn(), hide: jest.fn() } as any);
  useAutoModalsStore.setState({ storeReviewNextShowAt: null, storeReviewShownAt: null, storeReviewShownCount: 0, storeReviewDone: false });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('showStoreReviewModal — show', () => {
  it('shows a fullscreen modal that only its buttons can close', () => {
    showStoreReviewModal();

    expect(show()).toHaveBeenCalledTimes(1);
    expect(show().mock.calls[0][0]).toMatchObject({ type: 'fullscreen', dismissable: false });
  });

  it('shows with no checks — even after "Already rated" and during the wait', () => {
    useAutoModalsStore.setState({ storeReviewDone: true, storeReviewNextShowAt: NOW + DAY_MS });
    showStoreReviewModal();
    expect(show()).toHaveBeenCalledTimes(1);
  });

  it('records when it was shown and counts it, so the feedback modal can keep its distance', () => {
    showStoreReviewModal();
    expect(useAutoModalsStore.getState().storeReviewShownAt).toBe(NOW);
    expect(useAutoModalsStore.getState().storeReviewShownCount).toBe(1);
    expect(useAutoModalsStore.getState().storeReviewDone).toBe(false);
  });

  it('the 3rd show marks it done', () => {
    useAutoModalsStore.setState({ storeReviewShownCount: 2 });
    showStoreReviewModal();
    expect(useAutoModalsStore.getState().storeReviewShownCount).toBe(3);
    expect(useAutoModalsStore.getState().storeReviewDone).toBe(true);
  });
});

describe('showStoreReviewModal — buttons', () => {
  beforeEach(() => {
    showStoreReviewModal();
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

    expect(useAutoModalsStore.getState().storeReviewDone).toBe(true);
    expect(hide()).toHaveBeenCalledWith('openStore');
    expect(openStoreListing).toHaveBeenCalledTimes(1);
  });

  it('"Later" waits 7 days and closes', () => {
    fireEvent.press(screen.getByText('Later'));

    expect(useAutoModalsStore.getState().storeReviewNextShowAt).toBe(NOW + 7 * DAY_MS);
    expect(hide()).toHaveBeenCalledWith('later');
    expect(openStoreListing).not.toHaveBeenCalled();
  });

  it('"Already rated" stops it for good and closes', () => {
    fireEvent.press(screen.getByText('Already rated'));

    expect(useAutoModalsStore.getState().storeReviewDone).toBe(true);
    expect(hide()).toHaveBeenCalledWith('alreadyRated');
    expect(openStoreListing).not.toHaveBeenCalled();
  });
});

describe('showStoreReviewModal — from About', () => {
  beforeEach(() => {
    showStoreReviewModal(true);
    renderShownModal();
  });

  it('does not record the open', () => {
    expect(useAutoModalsStore.getState().storeReviewShownAt).toBeNull();
    expect(useAutoModalsStore.getState().storeReviewShownCount).toBe(0);
  });

  it('"Later" closes without starting a wait', () => {
    fireEvent.press(screen.getByText('Later'));

    expect(useAutoModalsStore.getState().storeReviewNextShowAt).toBeNull();
    expect(hide()).toHaveBeenCalledWith('later');
  });

  it('"Open Store" still stops it for good', () => {
    fireEvent.press(screen.getByText('Open Store'));

    expect(useAutoModalsStore.getState().storeReviewDone).toBe(true);
    expect(openStoreListing).toHaveBeenCalledTimes(1);
  });

  it('"Already rated" still stops it for good', () => {
    fireEvent.press(screen.getByText('Already rated'));
    expect(useAutoModalsStore.getState().storeReviewDone).toBe(true);
  });
});
