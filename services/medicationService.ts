import { Medicine, MedicationLog, AdherenceStatus, AdherenceStats } from '../types';
import { medicationRepository } from '../database/medicationRepository';
import { syncService } from './syncService';
// import { notificationService } from './notificationService';

/**
 * Medication service layer
 * Business logic for medication management and adherence tracking
 */
class MedicationService {
  /**
   * Add a new medicine
   */
  async addMedicine(medicine: Medicine): Promise<Medicine> {
    // Insert into local database
    await medicationRepository.insertMedicine(medicine);

    // Queue for sync
    await syncService.queueMedicineSync(medicine, 'create');

    // Schedule reminders if active
    // if (medicine.isActive) {
    //   await this.scheduleMedicineReminders(medicine);
    // }


    return medicine;
  }

  /**
   * Update an existing medicine
   */
  async updateMedicine(medicine: Medicine): Promise<Medicine> {
    // Update in local database
    await medicationRepository.updateMedicine(medicine);

    // Queue for sync
    await syncService.queueMedicineSync(medicine, 'update');

    // Reschedule reminders if active
    // if (medicine.isActive) {
    //   await this.scheduleMedicineReminders(medicine);
    // } else {
    //   await this.cancelMedicineReminders(medicine.id);
    // }


    return medicine;
  }

  /**
   * Delete a medicine
   */
  async deleteMedicine(id: string): Promise<void> {
    const medicine = await medicationRepository.getMedicineById(id);
    if (!medicine) return;

    // Cancel reminders
    // await this.cancelMedicineReminders(id);


    // Delete from local database
    await medicationRepository.deleteMedicine(id);

    // Queue for sync
    await syncService.queueMedicineSync(medicine, 'delete');
  }

  /**
   * Get all medicines for a user
   */
  async getMedicines(userId: string): Promise<Medicine[]> {
    return await medicationRepository.getMedicinesByUserId(userId);
  }

  /**
   * Get active medicines for a user
   */
  async getActiveMedicines(userId: string): Promise<Medicine[]> {
    return await medicationRepository.getActiveMedicinesByUserId(userId);
  }

  /**
   * Get a medicine by ID
   */
  async getMedicine(id: string): Promise<Medicine | null> {
    return await medicationRepository.getMedicineById(id);
  }

  /**
   * Get medicines with low stock
   */
  async getLowStockMedicines(userId: string): Promise<Medicine[]> {
    return await medicationRepository.getLowStockMedicines(userId);
  }

  /**
   * Get medicines expiring soon
   */
  async getExpiringMedicines(userId: string): Promise<Medicine[]> {
    return await medicationRepository.getExpiringMedicines(userId);
  }

  /**
   * Mark medication as taken
   */
  async markAsTaken(medicineId: string, scheduledTime: string, notes?: string): Promise<MedicationLog> {
    const log: MedicationLog = {
      id: `${medicineId}-${scheduledTime}-${Date.now()}`,
      medicineId,
      userId: '', // Will be filled from medicine
      scheduledTime,
      takenTime: new Date().toISOString(),
      status: 'taken',
      notes,
      createdAt: new Date().toISOString(),
    };

    const medicine = await medicationRepository.getMedicineById(medicineId);
    if (medicine) {
      log.userId = medicine.userId;
    }

    // Insert log
    await medicationRepository.insertMedicationLog(log);

    // Queue for sync
    await syncService.queueMedicationLogSync(log, 'create');

    // Update stock count
    if (medicine && medicine.stockCount > 0) {
      await this.updateStockCount(medicineId, medicine.stockCount - 1);
    }

    return log;
  }

  /**
   * Mark medication as missed
   */
  async markAsMissed(medicineId: string, scheduledTime: string, notes?: string): Promise<MedicationLog> {
    const log: MedicationLog = {
      id: `${medicineId}-${scheduledTime}-${Date.now()}`,
      medicineId,
      userId: '',
      scheduledTime,
      status: 'missed',
      notes,
      createdAt: new Date().toISOString(),
    };

    const medicine = await medicationRepository.getMedicineById(medicineId);
    if (medicine) {
      log.userId = medicine.userId;
    }

    await medicationRepository.insertMedicationLog(log);
    await syncService.queueMedicationLogSync(log, 'create');

    return log;
  }

  /**
   * Mark medication as delayed
   */
  async markAsDelayed(medicineId: string, scheduledTime: string, notes?: string): Promise<MedicationLog> {
    const log: MedicationLog = {
      id: `${medicineId}-${scheduledTime}-${Date.now()}`,
      medicineId,
      userId: '',
      scheduledTime,
      takenTime: new Date().toISOString(),
      status: 'delayed',
      notes,
      createdAt: new Date().toISOString(),
    };

    const medicine = await medicationRepository.getMedicineById(medicineId);
    if (medicine) {
      log.userId = medicine.userId;
    }

    await medicationRepository.insertMedicationLog(log);
    await syncService.queueMedicationLogSync(log, 'create');

    return log;
  }

  /**
   * Get medication logs for a user
   */
  async getMedicationLogs(userId: string): Promise<MedicationLog[]> {
    return await medicationRepository.getMedicationLogsByUserId(userId);
  }

  /**
   * Get medication logs for a specific medicine
   */
  async getMedicationLogsByMedicineId(medicineId: string): Promise<MedicationLog[]> {
    return await medicationRepository.getMedicationLogsByMedicineId(medicineId);
  }

  /**
   * Get today's medication logs for a user
   */
  async getTodayLogs(userId: string): Promise<MedicationLog[]> {
    return await medicationRepository.getTodayMedicationLogs(userId);
  }

  /**
   * Get adherence statistics for a user
   */
  async getAdherenceStats(userId: string): Promise<AdherenceStats> {
    const logs = await this.getMedicationLogs(userId);
    const todayLogs = await this.getTodayLogs(userId);

    const totalScheduled = logs.length;
    const totalTaken = logs.filter(l => l.status === 'taken').length;
    const totalMissed = logs.filter(l => l.status === 'missed').length;
    const totalDelayed = logs.filter(l => l.status === 'delayed').length;

    const todayTaken = todayLogs.filter(l => l.status === 'taken').length;
    const todayMissed = todayLogs.filter(l => l.status === 'missed').length;
    const todayPending = todayLogs.filter(l => l.status === 'pending').length;

    const adherencePercentage = totalScheduled > 0 
      ? Math.round((totalTaken / totalScheduled) * 100) 
      : 0;

    // Calculate streak (consecutive days with all medications taken)
    const streakDays = await this.calculateStreak(userId);

    return {
      totalScheduled,
      totalTaken,
      totalMissed,
      totalDelayed,
      adherencePercentage,
      streakDays,
      todayTaken,
      todayMissed,
      todayPending,
    };
  }

  /**
   * Calculate adherence streak
   */
  private async calculateStreak(userId: string): Promise<number> {
    const logs = await this.getMedicationLogs(userId);
    
    // Group logs by date
    const logsByDate = new Map<string, MedicationLog[]>();
    logs.forEach(log => {
      const date = log.scheduledTime.split('T')[0];
      if (!logsByDate.has(date)) {
        logsByDate.set(date, []);
      }
      logsByDate.get(date)!.push(log);
    });

    // Calculate streak
    let streak = 0;
    const dates = Array.from(logsByDate.keys()).sort().reverse();
    
    for (const date of dates) {
      const dayLogs = logsByDate.get(date)!;
      const allTaken = dayLogs.every(l => l.status === 'taken');
      
      if (allTaken) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Update stock count for a medicine
   */
  async updateStockCount(medicineId: string, newCount: number): Promise<void> {
    const medicine = await medicationRepository.getMedicineById(medicineId);
    if (!medicine) return;

    const updatedMedicine = {
      ...medicine,
      stockCount: newCount,
      updatedAt: new Date().toISOString(),
    };

    await medicationRepository.updateMedicine(updatedMedicine);
    await syncService.queueMedicineSync(updatedMedicine, 'update');
  }

  /**
   * Schedule reminders for a medicine
   */
  private async scheduleMedicineReminders(medicine: Medicine): Promise<void> {
    // Cancel existing reminders
    await this.cancelMedicineReminders(medicine.id);

    // Schedule new reminders based on timings
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

      // await notificationService.scheduleDailyReminder(reminder, hour, minute);

    }
  }

  /**
   * Cancel reminders for a medicine
   */
  private async cancelMedicineReminders(medicineId: string): Promise<void> {
    // Cancel all reminders for this medicine (Disabled in Expo Go)
    /*
    const scheduledNotifications = await notificationService.getScheduledNotifications();
    
    for (const notification of scheduledNotifications) {
      const data = notification.content.data as any;
      if (data?.medicineId === medicineId) {
        await notificationService.cancelReminder(notification.identifier);
      }
    }
    */
  }

  /**
   * Get upcoming reminders for today
   */
  async getUpcomingReminders(userId: string): Promise<any[]> {
    const medicines = await this.getActiveMedicines(userId);
    const now = new Date();
    const currentTime = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

    const upcomingReminders: any[] = [];

    for (const medicine of medicines) {
      for (const timing of medicine.timings) {
        if (timing > currentTime) {
          upcomingReminders.push({
            medicine,
            timing,
            scheduledTime: timing,
          });
        }
      }
    }

    return upcomingReminders.sort((a, b) => a.timing.localeCompare(b.timing));
  }

  /**
   * Check for low stock and return warnings
   */
  async checkLowStock(userId: string): Promise<Medicine[]> {
    return await this.getLowStockMedicines(userId);
  }

  /**
   * Check for expiring medicines and return warnings
   */
  async checkExpiringMedicines(userId: string): Promise<Medicine[]> {
    return await this.getExpiringMedicines(userId);
  }
}

// Export singleton instance
export const medicationService = new MedicationService();
