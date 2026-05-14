import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// The 'expo-notifications' library has internal side-effects that trigger push notification
// registration checks, which are now forbidden in Expo Go on Android SDK 53+.
// To prevent the app from crashing while still allowing development in Expo Go,
// we use this mockable service.

class NotificationService {
  private isInitialized = false;
  private _notifications: any = null;
  private isExpoGoAndroid = 
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient && 
    Platform.OS === 'android';

  private async getNotifications() {
    if (this.isExpoGoAndroid) {
      console.warn('Notifications: Native notifications are restricted in Expo Go on Android. Reminders will be logged to console only.');
      return null;
    }

    if (!this._notifications) {
      try {
        // We use dynamic import to avoid evaluation if we're in a restricted environment
        const mod = await import('expo-notifications');
        this._notifications = mod.default || mod;
      } catch (error) {
        console.error('Failed to load expo-notifications:', error);
        return null;
      }
    }
    return this._notifications;
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    if (this.isExpoGoAndroid) {
      this.isInitialized = true;
      return true;
    }

    const Notifications = await this.getNotifications();
    if (!Notifications) return false;

    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      const { status } = await Notifications.requestPermissionsAsync();
      this.isInitialized = status === 'granted';
      return this.isInitialized;
    } catch (error) {
      console.error('Notification init error:', error);
      return false;
    }
  }

  async scheduleDailyReminder(reminder: { id: string; medicineName: string; dosage: string; medicineId: string }, hour: number, minute: number): Promise<string> {
    if (this.isExpoGoAndroid) {
      console.log(`[MOCK NOTIFICATION] Scheduled daily for ${reminder.medicineName} at ${hour}:${minute}`);
      return `mock-id-${Date.now()}`;
    }

    try {
      const Notifications = await this.getNotifications();
      if (!Notifications) return '';

      return await Notifications.scheduleNotificationAsync({
        content: {
          title: '💊 Time for your medication',
          body: `It's time to take ${reminder.dosage} of ${reminder.medicineName}.`,
          data: { medicineId: reminder.medicineId, type: 'reminder' },
          sound: 'default',
        },
        trigger: {
          type: 'daily',
          hour,
          minute,
          repeats: true,
        } as any,
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return '';
    }
  }

  async triggerTestNotification(): Promise<void> {
    if (this.isExpoGoAndroid) {
      console.log(`[MOCK NOTIFICATION] Test notification triggered immediately.`);
      return;
    }

    try {
      const Notifications = await this.getNotifications();
      if (!Notifications) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💊 Time for your Paracetamol',
          body: `It's time to take 1 pill of Paracetamol. Take with water.`,
          data: { medicineId: 'test-id', type: 'reminder' },
          sound: 'default',
        },
        trigger: {
          type: 'timeInterval', // string literals are safer for dynamic imports
          seconds: 1,
          repeats: false,
        } as any,
      });
    } catch (error) {
      console.error('Error triggering test notification:', error);
    }
  }

  async checkPermissions(): Promise<boolean> {
    if (this.isExpoGoAndroid) return this.isInitialized;
    try {
      const Notifications = await this.getNotifications();
      if (!Notifications) return false;
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }

  async cancelAllReminders(): Promise<void> {
    if (this.isExpoGoAndroid) return;
    const Notifications = await this.getNotifications();
    await Notifications?.cancelAllScheduledNotificationsAsync?.();
  }

  async cancelReminder(id: string): Promise<void> {
    if (this.isExpoGoAndroid || id.startsWith('mock-id')) return;
    const Notifications = await this.getNotifications();
    await Notifications?.cancelScheduledNotificationAsync?.(id);
  }

  async addResponseListener(callback: (response: any) => void) {
    if (this.isExpoGoAndroid) return { remove: () => {} };
    const Notifications = await this.getNotifications();
    return Notifications?.addNotificationResponseReceivedListener?.(callback);
  }

  async addReceivedListener(callback: (notification: any) => void) {
    if (this.isExpoGoAndroid) return { remove: () => {} };
    const Notifications = await this.getNotifications();
    return Notifications?.addNotificationReceivedListener?.(callback);
  }
}

export const notificationService = new NotificationService();

export const handleNotificationResponse = async (response: any) => {
  const data = response?.notification?.request?.content?.data;
  if (data) console.log('Notification response received:', data);
};
