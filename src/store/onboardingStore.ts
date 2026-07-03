import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvStorage } from "@/store/storage";

interface OnboardingState {
  onboardingComplete: boolean;
  isReady: boolean;
  setOnboarding: (onboardingComplete: boolean) => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      onboardingComplete: false,
      isReady: false,

      setOnboarding: (onboardingComplete) => {
        set({ onboardingComplete });
      },
    }),
    {
      name: "onboarding-storage",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        onboardingComplete: state.onboardingComplete
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isReady = true;
        }
      },
    }
  )
);