import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { OnboardingState, UserRole } from '../types';
import { secureStorage } from './storage';

/**
 * Onboarding store interface
 */
interface OnboardingStore extends OnboardingState {
  setOnboarding: (state: Partial<OnboardingState>) => void;
  setSelectedRole: (role: UserRole) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  nextStep: () => void;
  previousStep: () => void;
}

/**
 * Global onboarding state management using Zustand
 * Tracks user onboarding progress and completion status
 * Persisted to secure storage
 */
export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      isCompleted: false,
      currentStep: 0,
      hasSeenWelcome: false,
      selectedRole: null,

      setOnboarding: (state) => set((prevState) => ({ ...prevState, ...state })),

      setSelectedRole: (role) => set({ selectedRole: role }),

      completeOnboarding: () => set({
        isCompleted: true,
        currentStep: 0,
      }),

      resetOnboarding: () => set({
        isCompleted: false,
        currentStep: 0,
        hasSeenWelcome: false,
        selectedRole: null,
      }),

      nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),

      previousStep: () => set((state) => ({ currentStep: Math.max(0, state.currentStep - 1) })),
    }),
    {
      name: 'medi-pulse-onboarding-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);

