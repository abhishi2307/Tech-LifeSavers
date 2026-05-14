import { Medicine, MedicationLog, SyncQueueItem } from '../types';
import { medicationRepository } from '../database/medicationRepository';
import { db } from './supabaseClient';

/**
 * Sync service for offline-first architecture
 * Handles synchronization between local SQLite and Supabase
 */
class SyncService {
  private isSyncing: boolean = false;
  private syncListeners: Set<() => void> = new Set();

  /**
   * Register a listener for sync status changes
   */
  onSyncStatusChange(listener: () => void) {
    this.syncListeners.add(listener);
    return () => this.syncListeners.delete(listener);
  }

  /**
   * Notify listeners of sync status change
   */
  private notifyListeners() {
    this.syncListeners.forEach(listener => listener());
  }

  /**
   * Check if currently syncing
   */
  isCurrentlySyncing(): boolean {
    return this.isSyncing;
  }

  /**
   * Sync all pending changes from local to Supabase
   */
  async syncAll(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing) {
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.notifyListeners();

    let success = 0;
    let failed = 0;

    try {
      const queueItems = await medicationRepository.getPendingSyncQueueItems();

      for (const item of queueItems) {
        try {
          await this.processSyncItem(item);
          await medicationRepository.markSyncQueueItemProcessed(item.id);
          success++;
        } catch (error) {
          await medicationRepository.updateSyncQueueItemRetry(
            item.id,
            error instanceof Error ? error.message : 'Unknown error'
          );
          failed++;
        }
      }
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }

    return { success, failed };
  }

  /**
   * Process a single sync queue item
   */
  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    switch (item.entityType) {
      case 'medicine':
        await this.syncMedicine(item);
        break;
      case 'medication_log':
        await this.syncMedicationLog(item);
        break;
      default:
        throw new Error(`Unknown entity type: ${item.entityType}`);
    }
  }

  /**
   * Sync a medicine to Supabase
   */
  private async syncMedicine(item: SyncQueueItem): Promise<void> {
    const medicine = item.data as Medicine;

    switch (item.action) {
      case 'create':
      case 'update':
        const { error: upsertError } = await db
          .from('medicines')
          .upsert({
            id: medicine.id,
            user_id: medicine.userId,
            name: medicine.name,
            dosage: medicine.dosage,
            frequency: medicine.frequency,
            timings: medicine.timings,
            start_date: medicine.startDate,
            end_date: medicine.endDate,
            instructions: medicine.instructions,
            stock_count: medicine.stockCount,
            refill_threshold: medicine.refillThreshold,
            medicine_type: medicine.medicineType,
            category: medicine.category,
            expiry_date: medicine.expiryDate,
            is_active: medicine.isActive,
            created_at: medicine.createdAt,
            updated_at: medicine.updatedAt,
          });

        if (upsertError) throw upsertError;

        // Update local synced_at timestamp
        await medicationRepository.updateMedicine({
          ...medicine,
          syncedAt: new Date().toISOString(),
        });
        break;

      case 'delete':
        const { error: deleteError } = await db
          .from('medicines')
          .delete()
          .eq('id', medicine.id);

        if (deleteError) throw deleteError;
        break;
    }
  }

  /**
   * Sync a medication log to Supabase
   */
  private async syncMedicationLog(item: SyncQueueItem): Promise<void> {
    const log = item.data as MedicationLog;

    switch (item.action) {
      case 'create':
      case 'update':
        const { error: upsertError } = await db
          .from('medication_logs')
          .upsert({
            id: log.id,
            medicine_id: log.medicineId,
            user_id: log.userId,
            scheduled_time: log.scheduledTime,
            taken_time: log.takenTime,
            status: log.status,
            notes: log.notes,
            created_at: log.createdAt,
          });

        if (upsertError) throw upsertError;

        // Update local synced_at timestamp
        await medicationRepository.updateMedicationLog({
          ...log,
          syncedAt: new Date().toISOString(),
        });
        break;

      case 'delete':
        const { error: deleteError } = await db
          .from('medication_logs')
          .delete()
          .eq('id', log.id);

        if (deleteError) throw deleteError;
        break;
    }
  }

  /**
   * Fetch medicines from Supabase and sync to local
   */
  async syncMedicinesFromServer(userId: string): Promise<void> {
    const { data, error } = await db
      .from('medicines')
      .select('*')
      .eq('user_id', userId)
      .gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

    if (error) throw error;

    for (const serverMedicine of data || []) {
      const localMedicine = await medicationRepository.getMedicineById(serverMedicine.id);

      if (!localMedicine || new Date(serverMedicine.updated_at) > new Date(localMedicine.updatedAt)) {
        // Server version is newer or doesn't exist locally
        const medicine: Medicine = {
          id: serverMedicine.id,
          userId: serverMedicine.user_id,
          name: serverMedicine.name,
          dosage: serverMedicine.dosage,
          frequency: serverMedicine.frequency,
          timings: serverMedicine.timings,
          startDate: serverMedicine.start_date,
          endDate: serverMedicine.end_date,
          instructions: serverMedicine.instructions,
          stockCount: serverMedicine.stock_count,
          refillThreshold: serverMedicine.refill_threshold,
          medicineType: serverMedicine.medicine_type,
          category: serverMedicine.category,
          expiryDate: serverMedicine.expiry_date,
          isActive: serverMedicine.is_active,
          createdAt: serverMedicine.created_at,
          updatedAt: serverMedicine.updated_at,
          syncedAt: new Date().toISOString(),
        };

        if (localMedicine) {
          await medicationRepository.updateMedicine(medicine);
        } else {
          await medicationRepository.insertMedicine(medicine);
        }
      }
    }
  }

  /**
   * Fetch medication logs from Supabase and sync to local
   */
  async syncMedicationLogsFromServer(userId: string): Promise<void> {
    const { data, error } = await db
      .from('medication_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

    if (error) throw error;

    for (const serverLog of data || []) {
      const localLog = await medicationRepository.getMedicationLogsByMedicineId(serverLog.medicine_id)
        .then(logs => logs.find(l => l.id === serverLog.id));

      if (!localLog) {
        // Log doesn't exist locally
        const log: MedicationLog = {
          id: serverLog.id,
          medicineId: serverLog.medicine_id,
          userId: serverLog.user_id,
          scheduledTime: serverLog.scheduled_time,
          takenTime: serverLog.taken_time,
          status: serverLog.status,
          notes: serverLog.notes,
          createdAt: serverLog.created_at,
          syncedAt: new Date().toISOString(),
        };

        await medicationRepository.insertMedicationLog(log);
      }
    }
  }

  /**
   * Full bidirectional sync
   */
  async fullSync(userId: string): Promise<void> {
    // First sync local changes to server
    await this.syncAll();

    // Then fetch latest from server
    await this.syncMedicinesFromServer(userId);
    await this.syncMedicationLogsFromServer(userId);
  }

  /**
   * Queue a medicine for sync
   */
  async queueMedicineSync(medicine: Medicine, action: 'create' | 'update' | 'delete'): Promise<void> {
    const syncItem: SyncQueueItem = {
      id: `${medicine.id}-${Date.now()}`,
      entityType: 'medicine',
      entityId: medicine.id,
      action,
      data: medicine,
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };

    await medicationRepository.addToSyncQueue(syncItem);
  }

  /**
   * Queue a medication log for sync
   */
  async queueMedicationLogSync(log: MedicationLog, action: 'create' | 'update' | 'delete'): Promise<void> {
    const syncItem: SyncQueueItem = {
      id: `${log.id}-${Date.now()}`,
      entityType: 'medication_log',
      entityId: log.id,
      action,
      data: log,
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };

    await medicationRepository.addToSyncQueue(syncItem);
  }
}

// Export singleton instance
export const syncService = new SyncService();
