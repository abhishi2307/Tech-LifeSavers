/**
 * Dummy Notification service (notifications are disabled in Expo Go for Android SDK 53+)
 */
class NotificationService {
  async initialize(): Promise<void> {}
  async scheduleReminder(reminder: any): Promise<string> { return ''; }
  async scheduleDailyReminder(reminder: any, hour: number, minute: number): Promise<string> { return ''; }
  async cancelReminder(id: string): Promise<void> {}
  async cancelAllReminders(): Promise<void> {}
  async snoozeReminder(id: string, minutes?: number): Promise<void> {}
  async getScheduledNotifications(): Promise<any[]> { return []; }
  getNotificationId(id: string): string | undefined { return undefined; }
  addResponseListener(callback: (response: any) => void): () => void { return () => {}; }
  addReceivedListener(callback: (notification: any) => void): () => void { return () => {}; }
}

export const notificationService = new NotificationService();

export const handleNotificationResponse = async (response: any) => {
};
