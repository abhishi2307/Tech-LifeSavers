import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ReminderNotification } from '../types';

/**
 * Notification service for medication reminders
 * Handles scheduling, canceling, and managing Expo Notifications
 */
class NotificationService {
  private notificationIds: Map<string, string> = new Map();

  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    // Request notification permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted');
    }

    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Configure Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('medication-reminders', {
        name: 'Medication Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1E88E5',
      });
    }
  }

  /**
   * Schedule a medication reminder notification
   */
  async scheduleReminder(reminder: ReminderNotification): Promise<string> {
    const trigger = new Date(reminder.scheduledTime);
    const now = new Date();

    if (trigger <= now) {
      console.warn('Cannot schedule reminder in the past');
      return '';
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Medication Reminder',
        body: `Time to take ${reminder.medicineName} - ${reminder.dosage}`,
        data: {
          medicineId: reminder.medicineId,
          scheduledTime: reminder.scheduledTime,
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        categoryIdentifier: 'medication-reminder',
      },
      trigger: {
        date: trigger,
        channelId: 'medication-reminders',
      },
    });

    this.notificationIds.set(reminder.id, notificationId);
    return notificationId;
  }

  /**
   * Schedule recurring daily reminders
   */
  async scheduleDailyReminder(
    reminder: ReminderNotification,
    hour: number,
    minute: number
  ): Promise<string> {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Medication Reminder',
        body: `Time to take ${reminder.medicineName} - ${reminder.dosage}`,
        data: {
          medicineId: reminder.medicineId,
          scheduledTime: reminder.scheduledTime,
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        categoryIdentifier: 'medication-reminder',
      },
      trigger: {
        hour,
        minute,
        repeats: true,
        channelId: 'medication-reminders',
      },
    });

    this.notificationIds.set(reminder.id, notificationId);
    return notificationId;
  }

  /**
   * Cancel a reminder notification
   */
  async cancelReminder(reminderId: string): Promise<void> {
    const notificationId = this.notificationIds.get(reminderId);
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      this.notificationIds.delete(reminderId);
    }
  }

  /**
   * Cancel all reminder notifications
   */
  async cancelAllReminders(): Promise<void> {
    for (const notificationId of this.notificationIds.values()) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    }
    this.notificationIds.clear();
  }

  /**
   * Snooze a reminder
   */
  async snoozeReminder(reminderId: string, minutes: number = 10): Promise<void> {
    const notificationId = this.notificationIds.get(reminderId);
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      
      const snoozeTime = new Date(Date.now() + minutes * 60 * 1000);
      const newNotificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Medication Reminder (Snoozed)',
          body: 'Snoozed reminder - take your medication now',
          data: {
            medicineId: reminderId,
            isSnoozed: true,
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: 'medication-reminder',
        },
        trigger: {
          date: snoozeTime,
          channelId: 'medication-reminders',
        },
      });

      this.notificationIds.set(reminderId, newNotificationId);
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  /**
   * Get notification ID for a reminder
   */
  getNotificationId(reminderId: string): string | undefined {
    return this.notificationIds.get(reminderId);
  }

  /**
   * Add notification response listener
   */
  addResponseListener(callback: (response: Notifications.NotificationResponse) => void): () => void {
    const subscription = Notifications.addNotificationResponseReceivedListener(callback);
    return () => subscription.remove();
  }

  /**
   * Add notification received listener
   */
  addReceivedListener(callback: (notification: Notifications.Notification) => void): () => void {
    const subscription = Notifications.addNotificationReceivedListener(callback);
    return () => subscription.remove();
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
