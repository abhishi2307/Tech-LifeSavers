import { supabase } from './supabaseClient';
import { Session, User } from '@supabase/supabase-js';

/**
 * Authentication service for Supabase
 * Handles all authentication operations
 */

export interface AuthResponse {
  data: Session | User | null;
  error: Error | null;
}

/**
 * Sign up a new user with email and password
 */
export const signUp = async (
  email: string, 
  password: string,
  metadata?: Record<string, any>
): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) throw error;

    return { data: data.session, error: null };
  } catch (error) {
    console.error('Signup error:', error);
    return { data: null, error: error as Error };
  }
};


/**
 * Sign in an existing user with email and password
 */
export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { data: data.session, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};

/**
 * Get the current session
 */
export const getSession = async (): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { data: data.session, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

/**
 * Get the current user
 */
export const getUser = async (): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { data: data.user, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

/**
 * Reset password - send reset email
 */
export const resetPassword = async (email: string): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'medipulseai://auth/reset-password',
    });
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};

/**
 * Update password (after reset)
 */
export const updatePassword = async (newPassword: string): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};

/**
 * Set up auth state change listener
 * Returns unsubscribe function
 */
export const onAuthStateChange = (callback: (session: Session | null) => void) => {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => data.subscription.unsubscribe();
};
