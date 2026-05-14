/**
 * Global TypeScript type definitions for MediPulse AI
 */

export interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  email: string | null;
  session: any | null;
}

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

export type UserRole = 'patient' | 'family_member' | 'caregiver' | 'doctor' | 'organization_admin';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
}

export interface OnboardingState {
  isCompleted: boolean;
  currentStep: number;
  hasSeenWelcome: boolean;
  selectedRole: UserRole | null;
}

export interface FamilyMember {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  avatar?: string;
  isCaregiver: boolean;
  allergies?: string[];
  bloodGroup?: string;
  emergencyPriority: number;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  localOnly?: boolean;
}

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
  precautions?: string;
  allergies?: string[];
  interactions?: string[];
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  localOnly?: boolean;
}

export type MedicationFrequency =
  | 'once_daily'
  | 'twice_daily'
  | 'three_times_daily'
  | 'four_times_daily'
  | 'weekly'
  | 'monthly'
  | 'as_needed'
  | 'custom';

export type MedicineType =
  | 'tablet'
  | 'capsule'
  | 'syrup'
  | 'liquid'
  | 'injection'
  | 'inhaler'
  | 'cream'
  | 'drops'
  | 'patch'
  | 'other';

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

export type AdherenceStatus = 'pending' | 'taken' | 'missed' | 'delayed' | 'skipped';

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

export interface SyncQueueItem {
  id: string;
  entityType: 'medicine' | 'medication_log' | 'family_member' | 'appointment';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  retryCount: number;
  lastError?: string;
  createdAt: string;
  processedAt?: string;
}

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

export type AppointmentType = 'checkup' | 'follow_up' | 'emergency' | 'specialist' | 'vaccination';
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  userId: string;
  title: string;
  doctorName?: string;
  clinicName?: string;
  appointmentDate: string;
  appointmentTime: string;
  type: AppointmentType;
  notes?: string;
  reminderMinutes: number;
  notificationId?: string;
  status: AppointmentStatus;
  location?: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  localOnly?: boolean;
}

export type DocumentType = 'prescription' | 'lab_report' | 'scan' | 'vaccination' | 'other';

export interface MedDocument {
  id: string;
  userId: string;
  title: string;
  type: DocumentType;
  fileUri: string;
  fileName: string;
  fileSize?: number;
  thumbnailUri?: string;
  notes?: string;
  tags?: string[];
  createdAt: string;
  syncedAt?: string;
}

export interface RootStackParamList {
  index: undefined;
  '(tabs)': undefined;
  '(tabs)/dashboard': undefined;
  '(tabs)/medications': undefined;
  '(tabs)/adherence': undefined;
  '(tabs)/family': undefined;
  '(tabs)/more': undefined;
  'auth/login': undefined;
  'auth/register': undefined;
  'auth/forgot-password': undefined;
  'onboarding/role-selection': undefined;
  'onboarding/profile-setup': undefined;
  'medications/add': undefined;
  'medications/edit': { id: string };
  'medications/details': { id: string };
  'family/add': undefined;
  'family/[id]': { id: string };
  'sos/index': undefined;
  'chatbot/index': undefined;
  'ocr/index': undefined;
  'appointments/index': undefined;
  'appointments/add': undefined;
  'appointments/[id]': { id: string };
  'reports/index': undefined;
  'precautions/index': undefined;
}
