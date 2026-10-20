import { openFeedbackModal } from "@/components/Feedback";
import { useFeedbackStore } from "@/store/feedbackStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import { useRateAppStore } from "@/store/rateAppStore";
import { useEffect } from "react";

// ------------------------------------------------------------
// Count the launch and offer the feedback modal — once per app launch, after onboarding.
// Waits, limits and collisions live in openFeedbackModal.
// ------------------------------------------------------------
export function useFeedbackSync() {
  const onboardingComplete = useOnboardingStore((state) => state.onboardingComplete);
  // Wait for both stores' hydration (MMKV is sync, so this is already true by read time)
  const feedbackReady = useFeedbackStore((state) => state.isReady);
  const rateAppReady = useRateAppStore((state) => state.isReady);

  useEffect(() => {
    if (!onboardingComplete || !feedbackReady || !rateAppReady) {
      return;
    }

    const { feedbackLaunchCount, setFeedbackLaunchCount } = useFeedbackStore.getState();
    setFeedbackLaunchCount(feedbackLaunchCount + 1);

    openFeedbackModal();
  }, [onboardingComplete, feedbackReady, rateAppReady]);
}
