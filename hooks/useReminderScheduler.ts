import { useEffect } from 'react';
import { Platform } from 'react-native';
// import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../store';
import { medicationService } from '../services';
import { notificationService } from '../services/notificationService';
import { Medicine } from '../types';

/**
 * Hook for scheduling medication reminders
 * Automatically schedules notifications for all active medicines
 */
export function useReminderScheduler() {
  const { userId } = useAuthStore();

  useEffect(() => {
    if (!userId) return;

    initializeReminders();
  }, [userId]);

  const initializeReminders = async () => {
    // Initialize notification service
    await notificationService.initialize();

    // Schedule reminders for all active medicines
    await scheduleAllReminders();

    // Set up notification response listener
    const responseSubscription = notificationService.addResponseListener(handleNotificationResponse);

    return () => {
      responseSubscription();
    };
  };

  const scheduleAllReminders = async () => {
    if (!userId) return;

    try {
      const medicines = await medicationService.getActiveMedicines(userId);
      
      for (const medicine of medicines) {
        await scheduleMedicineReminders(medicine);
      }
    } catch (error) {
      console.error('Failed to schedule reminders:', error);
    }
  };

  const scheduleMedicineReminders = async (medicine: Medicine) => {
    for (const timing of medicine.timings) {
      const [hour, minute] = timing.split(':').map(Number);
      
      const reminder = {
        id: `${medicine.id}-${timing}`,
        medicineId: medicine.id,
        medicineName: medicine.name,
        dosage: medicine.dosage,
        scheduledTime: timing,
        isSnoozed: false,
        status: 'scheduled' as const,
      };

      await notificationService.scheduleDailyReminder(reminder, hour, minute);
    }
  };

  const handleNotificationResponse = async (response: any) => {
    const { notification } = response;
    const data = notification.request.content.data as any;

    if (data?.medicineId) {
      // Handle notification tap - navigate to medicine details
      // This would typically navigate to the details screen
      console.log('Notification tapped for medicine:', data.medicineId);
    }
  };

  const rescheduleReminders = async () => {
    await notificationService.cancelAllReminders();
    await scheduleAllReminders();
  };

  return {
    scheduleAllReminders,
    rescheduleReminders,
  };
}
