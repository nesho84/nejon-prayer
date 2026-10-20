import { openFeedbackModal, showFeedbackModal } from '@/components/Feedback';
import { PAYPAL_DONATE_URL } from '@/constants/links';
import { sendFeedback } from '@/services/feedbackService';
import { useFeedbackStore } from '@/store/feedbackStore';
import { useModalStore } from '@/store/modalStore';
import { useRateAppStore } from '@/store/rateAppStore';
import { openExternalUrl } from '@/utils/system';
import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('@/utils/system', () => ({ openExternalUrl: jest.fn() }));
jest.mock('@/services/feedbackService', () => ({ sendFeedback: jest.fn() }));
jest.mock('@react-native-vector-icons/ionicons/static', () => {
  const React = require('react');
  return { Ionicons: ({ name }: any) => React.createElement('View', { testID: `icon-${name}` }) };
});
jest.mock('@react-native-vector-icons/material-design-icons/static', () => {
  const React = require('react');
  return { MaterialDesignIcons: ({ name }: any) => React.createElement('View', { testID: `mdi-${name}` }) };
});

const NOW = new Date('2026-10-20T12:00:00').getTime();
const DAY_MS = 24 * 60 * 60 * 1000;
const mockSendFeedback = sendFeedback as jest.Mock;

const show = () => useModalStore.getState().show as jest.Mock;
const hide = () => useModalStore.getState().hide as jest.Mock;

// Renders the content of the modal that was shown, so its buttons can be pressed
const renderShownModal = () => render(show().mock.calls[0][0].component);

// Answers the rating step and moves on
const rateAndNext = (stars = 4) => {
  fireEvent.press(screen.getByTestId(`star-${stars}`));
  fireEvent.press(screen.getByText('Next'));
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
  useModalStore.setState({ visible: false, show: jest.fn(), hide: jest.fn() } as any);
  useRateAppStore.setState({ rateAppShownAt: null });
  // Eligible by default — every test breaks one condition
  useFeedbackStore.setState({
    feedbackFirstSeenAt: NOW - 15 * DAY_MS,
    feedbackLaunchCount: 10,
    feedbackShownCount: 0,
    feedbackShownAt: null,
    feedbackSnoozedUntil: null,
    feedbackDone: false,
  });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('openFeedbackModal — when it shows', () => {
  it('shows a fullscreen modal that only its buttons can close, and counts it as shown', () => {
    openFeedbackModal();

    expect(show()).toHaveBeenCalledTimes(1);
    expect(show().mock.calls[0][0]).toMatchObject({ type: 'fullscreen', dismissable: false });
    expect(useFeedbackStore.getState().feedbackShownCount).toBe(1);
    expect(useFeedbackStore.getState().feedbackShownAt).toBe(NOW);
  });

  it('opens on the intro step', () => {
    openFeedbackModal();
    renderShownModal();
    expect(screen.getByText('How do you like Nejon Prayer?')).toBeTruthy();
  });

  it('starts the wait on the first launch after onboarding, without showing', () => {
    useFeedbackStore.setState({ feedbackFirstSeenAt: null });
    openFeedbackModal();

    expect(show()).not.toHaveBeenCalled();
    expect(useFeedbackStore.getState().feedbackFirstSeenAt).toBe(NOW);
  });

  it('does nothing before 14 days of use', () => {
    useFeedbackStore.setState({ feedbackFirstSeenAt: NOW - 13 * DAY_MS });
    openFeedbackModal();
    expect(show()).not.toHaveBeenCalled();
  });

  it('does nothing before 10 launches', () => {
    useFeedbackStore.setState({ feedbackLaunchCount: 9 });
    openFeedbackModal();
    expect(show()).not.toHaveBeenCalled();
  });

  it('does nothing while snoozed, and shows once the snooze is over', () => {
    useFeedbackStore.setState({ feedbackSnoozedUntil: NOW + DAY_MS });
    openFeedbackModal();
    expect(show()).not.toHaveBeenCalled();

    useFeedbackStore.setState({ feedbackSnoozedUntil: NOW - 1 });
    openFeedbackModal();
    expect(show()).toHaveBeenCalledTimes(1);
  });

  it('never shows once done (sent, or "Don\'t ask again")', () => {
    useFeedbackStore.setState({ feedbackDone: true });
    openFeedbackModal();
    expect(show()).not.toHaveBeenCalled();
  });

  it('stops after 3 shows', () => {
    useFeedbackStore.setState({ feedbackShownCount: 3 });
    openFeedbackModal();
    expect(show()).not.toHaveBeenCalled();
  });

  it('does nothing within 14 days of the "Rate the App" modal', () => {
    useRateAppStore.setState({ rateAppShownAt: NOW - 13 * DAY_MS });
    openFeedbackModal();
    expect(show()).not.toHaveBeenCalled();

    useRateAppStore.setState({ rateAppShownAt: NOW - 14 * DAY_MS - 1 });
    openFeedbackModal();
    expect(show()).toHaveBeenCalledTimes(1);
  });

  it('yields when another modal is already open', () => {
    useModalStore.setState({ visible: true });
    openFeedbackModal();
    expect(show()).not.toHaveBeenCalled();
  });
});

describe('showFeedbackModal', () => {
  it('shows with no checks — even when done — and still counts as shown', () => {
    useFeedbackStore.setState({ feedbackDone: true, feedbackShownCount: 3 });
    showFeedbackModal();

    expect(show()).toHaveBeenCalledTimes(1);
    expect(useFeedbackStore.getState().feedbackShownCount).toBe(4);
  });

  it('opens directly at the first question when asked (About row)', () => {
    showFeedbackModal('rating');
    renderShownModal();

    expect(screen.queryByText('How do you like Nejon Prayer?')).toBeNull();
    expect(screen.getByText('How do you like the app?')).toBeTruthy();
    expect(screen.getByText('Step 1 / 5')).toBeTruthy();
  });
});

describe('intro buttons', () => {
  beforeEach(() => {
    showFeedbackModal();
    renderShownModal();
  });

  it('"Share feedback" moves to the first question', () => {
    fireEvent.press(screen.getByText('Share feedback'));
    expect(screen.getByText('How do you like the app?')).toBeTruthy();
    expect(hide()).not.toHaveBeenCalled();
  });

  it('"Maybe later" snoozes for 30 days and closes', () => {
    fireEvent.press(screen.getByText('Maybe later'));

    expect(useFeedbackStore.getState().feedbackSnoozedUntil).toBe(NOW + 30 * DAY_MS);
    expect(useFeedbackStore.getState().feedbackDone).toBe(false);
    expect(hide()).toHaveBeenCalledWith('later');
  });

  it('"Don\'t ask again" marks it done and closes', () => {
    fireEvent.press(screen.getByText("Don't ask again"));

    expect(useFeedbackStore.getState().feedbackDone).toBe(true);
    expect(hide()).toHaveBeenCalledWith('never');
  });
});

describe('question steps', () => {
  beforeEach(() => {
    showFeedbackModal('rating');
    renderShownModal();
  });

  it('the rating has no Back, and Next only works once a star is picked', () => {
    expect(screen.queryByText('Back')).toBeNull();

    fireEvent.press(screen.getByText('Next'));
    expect(screen.getByText('Step 1 / 5')).toBeTruthy();

    rateAndNext();
    expect(screen.getByText('Which features do you use most?')).toBeTruthy();
    expect(screen.getByText('Step 2 / 5')).toBeTruthy();
  });

  it('Back returns to the previous question, Next with no answer moves on', () => {
    rateAndNext();

    fireEvent.press(screen.getByText('Back'));
    expect(screen.getByText('Step 1 / 5')).toBeTruthy();

    fireEvent.press(screen.getByText('Next'));
    fireEvent.press(screen.getByText('Next'));
    expect(screen.getByText('What needs improving?')).toBeTruthy();
  });

  it('the close icon snoozes and closes without sending (not an opt-out)', () => {
    fireEvent.press(screen.getByTestId('icon-close'));

    expect(useFeedbackStore.getState().feedbackSnoozedUntil).toBe(NOW + 30 * DAY_MS);
    expect(useFeedbackStore.getState().feedbackDone).toBe(false);
    expect(hide()).toHaveBeenCalledWith('close');
    expect(mockSendFeedback).not.toHaveBeenCalled();
  });
});

describe('sending', () => {
  beforeEach(() => {
    showFeedbackModal('rating');
    renderShownModal();
  });

  // Rating 4 → two "most used" chips → nothing on "improve" → "Maybe" → message
  const answerAll = () => {
    rateAndNext(4);
    fireEvent.press(screen.getByText('Prayer times'));
    fireEvent.press(screen.getByText('Qibla'));
    fireEvent.press(screen.getByText('Next'));
    fireEvent.press(screen.getByText('Next'));
    fireEvent.press(screen.getByText('Maybe'));
    fireEvent.press(screen.getByText('Next'));
    fireEvent.changeText(screen.getByPlaceholderText('Write your ideas here...'), '  More reciters please  ');
  };

  it('sends the ids, rating and trimmed message, then shows the thank-you step', async () => {
    mockSendFeedback.mockResolvedValue({ ok: true });
    answerAll();
    fireEvent.press(screen.getByText('Send'));

    expect(await screen.findByText('Thank you!')).toBeTruthy();
    expect(mockSendFeedback).toHaveBeenCalledWith({
      rating: 4,
      answers: { most_used: ['prayer_times', 'qibla'], donation_interest: 'maybe' },
      message: 'More reciters please',
      language: 'en',
    });
    expect(useFeedbackStore.getState().feedbackDone).toBe(true);
  });

  it('a second tap on a chip unselects it', async () => {
    mockSendFeedback.mockResolvedValue({ ok: true });
    rateAndNext(5);
    fireEvent.press(screen.getByText('Qibla'));
    fireEvent.press(screen.getByText('Qibla'));
    fireEvent.press(screen.getByText('Next'));
    fireEvent.press(screen.getByText('Next'));
    fireEvent.press(screen.getByText('Next'));
    fireEvent.press(screen.getByText('Send'));

    expect(await screen.findByText('Thank you!')).toBeTruthy();
    expect(mockSendFeedback).toHaveBeenCalledWith({ rating: 5, answers: undefined, message: undefined, language: 'en' });
  });

  it('shows only a spinner in the Send button while the request runs', () => {
    mockSendFeedback.mockReturnValue(new Promise(() => {}));
    answerAll();
    fireEvent.press(screen.getByText('Send'));

    expect(screen.queryByText('Send')).toBeNull();
    expect(mockSendFeedback).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['offline', 'No internet connection. Check your connection and try again.'],
    ['server', 'Something went wrong. Please try again.'],
  ])('shows the %s error step, and Retry resends the kept answers', async (error, text) => {
    mockSendFeedback.mockResolvedValueOnce({ error }).mockResolvedValueOnce({ ok: true });
    answerAll();
    fireEvent.press(screen.getByText('Send'));

    expect(await screen.findByText(text)).toBeTruthy();
    expect(screen.getByText('Error')).toBeTruthy();
    expect(screen.queryByText('What should we improve or add?')).toBeNull();
    expect(useFeedbackStore.getState().feedbackDone).toBe(false);

    fireEvent.press(screen.getByText('Retry'));
    expect(await screen.findByText('Thank you!')).toBeTruthy();
    expect(mockSendFeedback).toHaveBeenCalledTimes(2);
    expect(mockSendFeedback.mock.calls[1][0]).toEqual(mockSendFeedback.mock.calls[0][0]);
  });

  it('a second failure stays on the error step', async () => {
    mockSendFeedback.mockResolvedValue({ error: 'server' });
    answerAll();
    fireEvent.press(screen.getByText('Send'));
    await screen.findByText('Error');

    fireEvent.press(screen.getByText('Retry'));
    await screen.findByText('Retry');

    expect(mockSendFeedback).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Something went wrong. Please try again.')).toBeTruthy();
  });

  it('the rate limit has no Retry — only Close, which snoozes', async () => {
    mockSendFeedback.mockResolvedValue({ error: 'rateLimited' });
    answerAll();
    fireEvent.press(screen.getByText('Send'));

    expect(await screen.findByText('Too many submissions today. Please try again tomorrow.')).toBeTruthy();
    expect(screen.queryByText('Retry')).toBeNull();

    // findByText advances the fake clock — measure the snooze from the press
    const pressedAt = Date.now();
    fireEvent.press(screen.getByText('Close'));
    expect(useFeedbackStore.getState().feedbackSnoozedUntil).toBe(pressedAt + 30 * DAY_MS);
    expect(useFeedbackStore.getState().feedbackDone).toBe(false);
    expect(hide()).toHaveBeenCalledWith('close');
  });

  it('the thank-you step offers the support link and closes', async () => {
    mockSendFeedback.mockResolvedValue({ ok: true });
    answerAll();
    fireEvent.press(screen.getByText('Send'));
    await screen.findByText('Thank you!');

    fireEvent.press(screen.getByText('Support the app'));
    expect(openExternalUrl).toHaveBeenCalledWith(PAYPAL_DONATE_URL);

    fireEvent.press(screen.getByText('Close'));
    expect(hide()).toHaveBeenCalledWith('close');
  });
});
