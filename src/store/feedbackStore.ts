import { sendFeedback } from "@/services/feedbackService";
import { useLanguageStore } from "@/store/languageStore";
import { mmkvStorage } from "@/store/storage";
import { FeedbackInput, FeedbackResult } from "@/types/feedback.types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface FeedbackState {
  feedbackFirstSeenAt: number | null;
  feedbackLaunchCount: number;
  feedbackShownCount: number;
  feedbackShownAt: number | null;
  feedbackSnoozedUntil: number | null;
  feedbackDone: boolean;
  isReady: boolean;
  setFeedbackFirstSeenAt: (feedbackFirstSeenAt: number | null) => void;
  setFeedbackLaunchCount: (feedbackLaunchCount: number) => void;
  setFeedbackShownCount: (feedbackShownCount: number) => void;
  setFeedbackShownAt: (feedbackShownAt: number | null) => void;
  setFeedbackSnoozedUntil: (feedbackSnoozedUntil: number | null) => void;
  setFeedbackDone: (feedbackDone: boolean) => void;
  submitFeedback: (input: Omit<FeedbackInput, "language">) => Promise<FeedbackResult>;
}

export const useFeedbackStore = create<FeedbackState>()(
  persist(
    (set) => ({
      feedbackFirstSeenAt: null,
      feedbackLaunchCount: 0,
      feedbackShownCount: 0,
      feedbackShownAt: null,
      feedbackSnoozedUntil: null,
      feedbackDone: false,
      isReady: false,

      // First launch after onboarding — the "used it long enough" wait starts here
      setFeedbackFirstSeenAt: (feedbackFirstSeenAt) => {
        set({ feedbackFirstSeenAt });
      },

      // App launches since onboarding
      setFeedbackLaunchCount: (feedbackLaunchCount) => {
        set({ feedbackLaunchCount });
      },

      // How many times the prompt was shown — stops for good at the limit
      setFeedbackShownCount: (feedbackShownCount) => {
        set({ feedbackShownCount });
      },

      // Last time the prompt was shown — keeps it apart from the "Rate the App" modal
      setFeedbackShownAt: (feedbackShownAt) => {
        set({ feedbackShownAt });
      },

      // User tapped "Maybe later" — earliest time the prompt may show again
      setFeedbackSnoozedUntil: (feedbackSnoozedUntil) => {
        set({ feedbackSnoozedUntil });
      },

      // Sent the questionnaire, or tapped "Don't ask again" — never show the prompt again
      setFeedbackDone: (feedbackDone) => {
        set({ feedbackDone });
      },

      // Send the questionnaire — a successful send stops the prompt for good
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
        feedbackFirstSeenAt: state.feedbackFirstSeenAt,
        feedbackLaunchCount: state.feedbackLaunchCount,
        feedbackShownCount: state.feedbackShownCount,
        feedbackShownAt: state.feedbackShownAt,
        feedbackSnoozedUntil: state.feedbackSnoozedUntil,
        feedbackDone: state.feedbackDone,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isReady = true;
        }
      },
    }
  )
);
