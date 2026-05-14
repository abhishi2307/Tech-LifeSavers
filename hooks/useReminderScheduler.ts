import { useEffect } from 'react';
import { useAuthStore, useMedicationStore } from '../store';
import { medicationService } from '../services';
import { notificationService } from '../services/notificationService';
import { Medicine } from '../types';

/**
 * Hook for scheduling medication reminders
 * Automatically schedules notifications for all active medicines
 */
export function useReminderScheduler() {
  const { userId } = useAuthStore();
  const { medicines } = useMedicationStore();

  useEffect(() => {
    if (!userId) return;

    let responseSubscription: any;

    const setup = async () => {
      // Initialize notification service
      await notificationService.initialize();

      // Schedule/Reschedule reminders for all active medicines
      await rescheduleReminders();

      // Set up notification response listener
      responseSubscription = await notificationService.addResponseListener(handleNotificationResponse);
    };

    setup();

    return () => {
      responseSubscription?.remove?.();
    };
  }, [userId, medicines]);

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
      
      if (isNaN(hour) || isNaN(minute)) {
        console.warn(`Invalid timing format for medicine ${medicine.name}: ${timing}`);
        continue;
      }
      
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
