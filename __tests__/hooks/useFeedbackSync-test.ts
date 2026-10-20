import { openFeedbackModal } from '@/components/Feedback';
import { useFeedbackSync } from '@/hooks/useFeedbackSync';
import { useFeedbackStore } from '@/store/feedbackStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useRateAppStore } from '@/store/rateAppStore';
import { act, renderHook } from '@testing-library/react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('@/components/Feedback', () => ({ openFeedbackModal: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  useOnboardingStore.setState({ onboardingComplete: true });
  useFeedbackStore.setState({ isReady: true, feedbackLaunchCount: 0 });
  useRateAppStore.setState({ isReady: true });
});

describe('useFeedbackSync', () => {
  it('counts the launch and offers the modal once on mount', () => {
    renderHook(() => useFeedbackSync());

    expect(useFeedbackStore.getState().feedbackLaunchCount).toBe(1);
    expect(openFeedbackModal).toHaveBeenCalledTimes(1);
  });

  it('does not run again on re-render', () => {
    const { rerender } = renderHook(() => useFeedbackSync());
    rerender({});

    expect(useFeedbackStore.getState().feedbackLaunchCount).toBe(1);
    expect(openFeedbackModal).toHaveBeenCalledTimes(1);
  });

  it('does nothing during onboarding', () => {
    useOnboardingStore.setState({ onboardingComplete: false });
    renderHook(() => useFeedbackSync());

    expect(useFeedbackStore.getState().feedbackLaunchCount).toBe(0);
    expect(openFeedbackModal).not.toHaveBeenCalled();
  });

  it('does nothing until the feedback store has hydrated', () => {
    useFeedbackStore.setState({ isReady: false });
    renderHook(() => useFeedbackSync());
    expect(openFeedbackModal).not.toHaveBeenCalled();
  });

  it('does nothing until the rate-app store has hydrated', () => {
    useRateAppStore.setState({ isReady: false });
    renderHook(() => useFeedbackSync());
    expect(openFeedbackModal).not.toHaveBeenCalled();
  });

  it('runs when onboarding completes', () => {
    useOnboardingStore.setState({ onboardingComplete: false });
    renderHook(() => useFeedbackSync());
    act(() => useOnboardingStore.setState({ onboardingComplete: true }));

    expect(useFeedbackStore.getState().feedbackLaunchCount).toBe(1);
    expect(openFeedbackModal).toHaveBeenCalledTimes(1);
  });
});
