import { sendFeedback } from "@/services/feedbackService";
import { useLanguageStore } from "@/store/languageStore";
import { mmkvStorage } from "@/store/storage";
import { FeedbackInput, FeedbackResult } from "@/types/feedback.types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface FeedbackState {
  feedbackNextShowAt: number | null;
  feedbackShownAt: number | null;
  feedbackShownCount: number;
  feedbackDone: boolean;
  feedbackLaunchCount: number;
  isReady: boolean;
  setFeedbackNextShowAt: (feedbackNextShowAt: number | null) => void;
  setFeedbackShownAt: (feedbackShownAt: number | null) => void;
  setFeedbackShownCount: (feedbackShownCount: number) => void;
  setFeedbackDone: (feedbackDone: boolean) => void;
  setFeedbackLaunchCount: (feedbackLaunchCount: number) => void;
  submitFeedback: (input: Omit<FeedbackInput, "language">) => Promise<FeedbackResult>;
}

export const useFeedbackStore = create<FeedbackState>()(
  persist(
    (set) => ({
      feedbackNextShowAt: null,
      feedbackShownAt: null,
      feedbackShownCount: 0,
      feedbackDone: false,
      feedbackLaunchCount: 0,
      isReady: false,

      // Earliest time the modal may show — null until the first app start after onboarding
      setFeedbackNextShowAt: (feedbackNextShowAt) => {
        set({ feedbackNextShowAt });
      },

      // Last time the modal was shown — keeps it apart from the "Rate the App" modal
      setFeedbackShownAt: (feedbackShownAt) => {
        set({ feedbackShownAt });
      },

      // How many times the modal was shown
      setFeedbackShownCount: (feedbackShownCount) => {
        set({ feedbackShownCount });
      },

      // Stopped for good — sent, tapped "Don't ask again", or shown the max times
      setFeedbackDone: (feedbackDone) => {
        set({ feedbackDone });
      },

      // App launches since onboarding
      setFeedbackLaunchCount: (feedbackLaunchCount) => {
        set({ feedbackLaunchCount });
      },

      // Send the questionnaire — a successful send stops the modal for good
      submitFeedback: async (input) => {
        const language = useLanguageStore.getState().language;
        const result = await sendFeedback({ ...input, language });

        if ("ok" in result) {
          set({ feedbackDone: true });
        }
        return result;
      },
    }),
    {
      name: "feedback-storage",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        feedbackNextShowAt: state.feedbackNextShowAt,
        feedbackShownAt: state.feedbackShownAt,
        feedbackShownCount: state.feedbackShownCount,
        feedbackDone: state.feedbackDone,
        feedbackLaunchCount: state.feedbackLaunchCount,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isReady = true;
        }
      },
    }
  )
);
