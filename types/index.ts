/**
 * Global TypeScript type definitions for MediPulse AI
 */

/**
 * User authentication state
 */
export interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  email: string | null;
  session: any | null;
}

/**
 * User profile information
 */
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  dateOfBirth?: string;
  age?: number;
  gender?: Gender;
  bloodGroup?: BloodGroup;
  allergies?: string[];
  emergencyContact?: EmergencyContact;
  phoneNumber?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * User roles
 */
export type UserRole = 'patient' | 'family_member' | 'caregiver' | 'doctor' | 'organization_admin';

/**
 * Gender options
 */
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

/**
 * Blood group options
 */
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

/**
 * Emergency contact information
 */
export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
}

/**
 * Onboarding state
 */
export interface OnboardingState {
  isCompleted: boolean;
  currentStep: number;
  hasSeenWelcome: boolean;
  selectedRole: UserRole | null;
}

/**
 * Medication reminder
 */
export interface MedicationReminder {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'as_needed';
  time: string;
  startDate: string;
  endDate?: string;
  notes?: string;
  isActive: boolean;
}

/**
 * Family member
 */
export interface FamilyMember {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  avatar?: string;
  isCaregiver: boolean;
}

/**
 * Medication reminder
 */
export interface MedicationReminder {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'as_needed';
  time: string;
  startDate: string;
  endDate?: string;
  notes?: string;
  isActive: boolean;
}

/**
 * Family member
 */
export interface FamilyMember {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  avatar?: string;
  isCaregiver: boolean;
}

/**
 * Navigation route params
 */
export interface RootStackParamList {
  index: undefined;
  'auth/login': undefined;
  'auth/register': undefined;
  'auth/forgot-password': undefined;
  'onboarding/role-selection': undefined;
  'onboarding/profile-setup': undefined;
  'dashboard/index': undefined;
  'medications/index': undefined;
  'medications/add': undefined;
  'medications/edit': { id: string };
  'medications/details': { id: string };
  'adherence/index': undefined;
}

/**
 * Medicine entity
 */
export interface Medicine {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  frequency: MedicationFrequency;
  timings: string[];
  startDate: string;
  endDate?: string;
  instructions?: string;
  stockCount: number;
  refillThreshold: number;
  medicineType: MedicineType;
  category?: string;
  expiryDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  localOnly?: boolean;
}

/**
 * Medication frequency options
 */
export type MedicationFrequency = 'once_daily' | 'twice_daily' | 'three_times_daily' | 'four_times_daily' | 'weekly' | 'monthly' | 'as_needed' | 'custom';

/**
 * Medicine type/category
 */
export type MedicineType = 'tablet' | 'capsule' | 'liquid' | 'injection' | 'inhaler' | 'cream' | 'drops' | 'patch' | 'other';

/**
 * Medication log (adherence tracking)
 */
export interface MedicationLog {
  id: string;
  medicineId: string;
  userId: string;
  scheduledTime: string;
  takenTime?: string;
  status: AdherenceStatus;
  notes?: string;
  createdAt: string;
  syncedAt?: string;
  localOnly?: boolean;
}

/**
 * Adherence status
 */
export type AdherenceStatus = 'pending' | 'taken' | 'missed' | 'delayed' | 'skipped';

/**
 * Reminder notification
 */
export interface ReminderNotification {
  id: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  scheduledTime: string;
  notificationId?: string;
  isSnoozed: boolean;
  snoozeUntil?: string;
  status: 'scheduled' | 'sent' | 'dismissed' | 'snoozed';
}

/**
 * Sync queue item
 */
export interface SyncQueueItem {
  id: string;
  entityType: 'medicine' | 'medication_log';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  retryCount: number;
  lastError?: string;
  createdAt: string;
  processedAt?: string;
}

/**
 * Adherence statistics
 */
export interface AdherenceStats {
  totalScheduled: number;
  totalTaken: number;
  totalMissed: number;
  totalDelayed: number;
  adherencePercentage: number;
  streakDays: number;
  todayTaken: number;
  todayMissed: number;
  todayPending: number;
}
