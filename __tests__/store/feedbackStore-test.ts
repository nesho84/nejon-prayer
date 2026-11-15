import { sendFeedback } from '@/services/feedbackService';
import { useFeedbackStore } from '@/store/feedbackStore';
import { useLanguageStore } from '@/store/languageStore';

jest.mock('@/store/storage', () => ({
  mmkvStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('@/services/feedbackService', () => ({
  sendFeedback: jest.fn(),
}));

const mockSendFeedback = sendFeedback as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  useFeedbackStore.setState({
    feedbackNextShowAt: null,
    feedbackShownAt: null,
    feedbackShownCount: 0,
    feedbackDone: false,
    feedbackLaunchCount: 0,
  });
  useLanguageStore.setState({ language: 'en' });
});

describe('feedbackStore — setters', () => {
  it('starts with nothing recorded', () => {
    const state = useFeedbackStore.getState();
    expect(state.feedbackNextShowAt).toBeNull();
    expect(state.feedbackShownAt).toBeNull();
    expect(state.feedbackShownCount).toBe(0);
    expect(state.feedbackDone).toBe(false);
    expect(state.feedbackLaunchCount).toBe(0);
  });

  it('stores the launch count', () => {
    useFeedbackStore.getState().setFeedbackLaunchCount(5);
    expect(useFeedbackStore.getState().feedbackLaunchCount).toBe(5);
  });

  it('stores the shown count and timestamp', () => {
    useFeedbackStore.getState().setFeedbackShownCount(2);
    useFeedbackStore.getState().setFeedbackShownAt(5678);
    expect(useFeedbackStore.getState().feedbackShownCount).toBe(2);
    expect(useFeedbackStore.getState().feedbackShownAt).toBe(5678);
  });

  it('stores and clears the next-show time', () => {
    useFeedbackStore.getState().setFeedbackNextShowAt(9999);
    expect(useFeedbackStore.getState().feedbackNextShowAt).toBe(9999);
    useFeedbackStore.getState().setFeedbackNextShowAt(null);
    expect(useFeedbackStore.getState().feedbackNextShowAt).toBeNull();
  });

  it('sets feedbackDone to true', () => {
    useFeedbackStore.getState().setFeedbackDone(true);
    expect(useFeedbackStore.getState().feedbackDone).toBe(true);
  });
});

describe('feedbackStore — submitFeedback', () => {
  it('sends the answers with the current language', async () => {
    mockSendFeedback.mockResolvedValue({ ok: true });
    useLanguageStore.setState({ language: 'ar' });

    await useFeedbackStore.getState().submitFeedback({ rating: 4, answers: { donation_interest: 'maybe' } });

    expect(mockSendFeedback).toHaveBeenCalledWith({ rating: 4, answers: { donation_interest: 'maybe' }, language: 'ar' });
  });

  it('marks feedback as done and returns { ok } on success', async () => {
    mockSendFeedback.mockResolvedValue({ ok: true });

    const result = await useFeedbackStore.getState().submitFeedback({ rating: 5 });

    expect(result).toEqual({ ok: true });
    expect(useFeedbackStore.getState().feedbackDone).toBe(true);
  });

  it.each(['offline', 'rateLimited', 'server'])('returns the %s error and stays not done', async (error) => {
    mockSendFeedback.mockResolvedValue({ error });

    const result = await useFeedbackStore.getState().submitFeedback({ rating: 5 });

    expect(result).toEqual({ error });
    expect(useFeedbackStore.getState().feedbackDone).toBe(false);
  });
});
