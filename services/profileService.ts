import { supabase } from './supabaseClient';
import { UserProfile } from '../types';

/**
 * Profile service for Supabase
 * Handles user profile operations
 */

export interface ProfileResponse {
  data: UserProfile | null;
  error: Error | null;
}

/**
 * Create or update user profile
 */
export const upsertProfile = async (profile: Partial<UserProfile>): Promise<ProfileResponse> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        ...profile,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return { data: data as UserProfile, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

/**
 * Get user profile by ID
 */
export const getProfile = async (userId: string): Promise<ProfileResponse> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return { data: data as UserProfile, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (
  userId: string,
  updates: Partial<UserProfile>
): Promise<ProfileResponse> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return { data: data as UserProfile, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

/**
 * Delete user profile
 */
export const deleteProfile = async (userId: string): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};
