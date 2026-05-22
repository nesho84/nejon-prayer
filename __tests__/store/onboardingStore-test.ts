jest.mock('@/store/storage', () => ({
  mmkvStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

import { useOnboardingStore } from '@/store/onboardingStore';

beforeEach(() => {
  useOnboardingStore.setState({ onboardingComplete: false });
});

describe('onboardingStore — setOnboarding', () => {
  it('starts with onboardingComplete as false', () => {
    expect(useOnboardingStore.getState().onboardingComplete).toBe(false);
  });

  it('sets onboardingComplete to true', () => {
    useOnboardingStore.getState().setOnboarding(true);
    expect(useOnboardingStore.getState().onboardingComplete).toBe(true);
  });

  it('sets onboardingComplete back to false', () => {
    useOnboardingStore.setState({ onboardingComplete: true });
    useOnboardingStore.getState().setOnboarding(false);
    expect(useOnboardingStore.getState().onboardingComplete).toBe(false);
  });
});
