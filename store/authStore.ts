import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthState, UserProfile } from '../types';
import { Session } from '@supabase/supabase-js';
import { secureStorage } from './storage';

/**
 * Auth store interface
 */
interface AuthStore extends AuthState {
  setAuth: (auth: Partial<AuthState>) => void;
  setSession: (session: Session | null) => void;
  logout: () => void;
  setUserProfile: (profile: UserProfile | null) => void;
  userProfile: UserProfile | null;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

/**
 * Global authentication state management using Zustand
 * Handles user authentication status, session, and profile data
 * Persisted to secure storage for session persistence
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      userId: null,
      email: null,
      session: null,
      userProfile: null,
      isLoading: true,

      setAuth: (auth) => set((state) => ({ ...state, ...auth })),

      setSession: (session) => set({
        session,
        isAuthenticated: !!session,
        userId: session?.user?.id || null,
        email: session?.user?.email || null,
      }),

      logout: () => set({
        isAuthenticated: false,
        userId: null,
        email: null,
        session: null,
        userProfile: null,
      }),

      setUserProfile: (profile) => set({ userProfile: profile }),

      setIsLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'medi-pulse-auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        userId: state.userId,
        email: state.email,
        userProfile: state.userProfile,
      }),
    }
  )
);

