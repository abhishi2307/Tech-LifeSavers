import { Medicine, MedicationLog, SyncQueueItem } from '../types';
import { sqliteService } from './sqliteService';

/**
 * Medication repository for SQLite operations
 * Provides offline-safe CRUD operations for medicines and logs
 */
class MedicationRepository {
  /**
   * Insert a new medicine into local database
   */
  async insertMedicine(medicine: Medicine): Promise<void> {
    await sqliteService.insert('medicines', {
      id: medicine.id,
      user_id: medicine.userId,
      name: medicine.name,
      dosage: medicine.dosage,
      frequency: medicine.frequency,
      timings: JSON.stringify(medicine.timings),
      start_date: medicine.startDate,
      end_date: medicine.endDate || null,
      instructions: medicine.instructions || null,
      stock_count: medicine.stockCount,
      refill_threshold: medicine.refillThreshold,
      medicine_type: medicine.medicineType,
      category: medicine.category || null,
      expiry_date: medicine.expiryDate || null,
      is_active: medicine.isActive ? 1 : 0,
      created_at: medicine.createdAt,
      updated_at: medicine.updatedAt,
      synced_at: medicine.syncedAt || null,
      local_only: medicine.localOnly ? 1 : 0,
    });
  }

  /**
   * Update an existing medicine in local database
   */
  async updateMedicine(medicine: Medicine): Promise<void> {
    await sqliteService.update(
      'medicines',
      {
        name: medicine.name,
        dosage: medicine.dosage,
        frequency: medicine.frequency,
        timings: JSON.stringify(medicine.timings),
        start_date: medicine.startDate,
        end_date: medicine.endDate || null,
        instructions: medicine.instructions || null,
        stock_count: medicine.stockCount,
        refill_threshold: medicine.refillThreshold,
        medicine_type: medicine.medicineType,
        category: medicine.category || null,
        expiry_date: medicine.expiryDate || null,
        is_active: medicine.isActive ? 1 : 0,
        updated_at: medicine.updatedAt,
        synced_at: medicine.syncedAt || null,
      },
      'id = ?',
      [medicine.id]
    );
  }

  /**
   * Delete a medicine from local database
   */
  async deleteMedicine(id: string): Promise<void> {
    await sqliteService.delete('medicines', 'id = ?', [id]);
  }

  /**
   * Get a medicine by ID
   */
  async getMedicineById(id: string): Promise<Medicine | null> {
    const results = await sqliteService.query('medicines', 'id = ?', [id]);
    if (results.length === 0) return null;
    return this.mapRowToMedicine(results[0]);
  }

  /**
   * Get all medicines for a user
   */
  async getMedicinesByUserId(userId: string): Promise<Medicine[]> {
    const results = await sqliteService.query('medicines', 'user_id = ?', [userId]);
    return results.map((row: any) => this.mapRowToMedicine(row));
  }

  /**
   * Get active medicines for a user
   */
  async getActiveMedicinesByUserId(userId: string): Promise<Medicine[]> {
    const results = await sqliteService.query(
      'medicines',
      'user_id = ? AND is_active = 1',
      [userId]
    );
    return results.map((row: any) => this.mapRowToMedicine(row));
  }

  /**
   * Get medicines with low stock
   */
  async getLowStockMedicines(userId: string): Promise<Medicine[]> {
    const results = await sqliteService.query(
      'medicines',
      'user_id = ? AND stock_count <= refill_threshold AND is_active = 1',
      [userId]
    );
    return results.map((row: any) => this.mapRowToMedicine(row));
  }

  /**
   * Get medicines expiring soon (within 30 days)
   */
  async getExpiringMedicines(userId: string): Promise<Medicine[]> {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const results = await sqliteService.query(
      'medicines',
      'user_id = ? AND expiry_date IS NOT NULL AND expiry_date <= ? AND is_active = 1',
      [userId, thirtyDaysFromNow.toISOString()]
    );
    return results.map((row: any) => this.mapRowToMedicine(row));
  }

  /**
   * Insert a medication log
   */
  async insertMedicationLog(log: MedicationLog): Promise<void> {
    await sqliteService.insert('medication_logs', {
      id: log.id,
      medicine_id: log.medicineId,
      user_id: log.userId,
      scheduled_time: log.scheduledTime,
      taken_time: log.takenTime || null,
      status: log.status,
      notes: log.notes || null,
      created_at: log.createdAt,
      synced_at: log.syncedAt || null,
      local_only: log.localOnly ? 1 : 0,
    });
  }

  /**
   * Update a medication log
   */
  async updateMedicationLog(log: MedicationLog): Promise<void> {
    await sqliteService.update(
      'medication_logs',
      {
        taken_time: log.takenTime || null,
        status: log.status,
        notes: log.notes || null,
        synced_at: log.syncedAt || null,
      },
      'id = ?',
      [log.id]
    );
  }

  /**
   * Get medication logs for a user
   */
  async getMedicationLogsByUserId(userId: string): Promise<MedicationLog[]> {
    const results = await sqliteService.query('medication_logs', 'user_id = ?', [userId]);
    return results.map((row: any) => this.mapRowToMedicationLog(row));
  }

  /**
   * Get medication logs for a specific medicine
   */
  async getMedicationLogsByMedicineId(medicineId: string): Promise<MedicationLog[]> {
    const results = await sqliteService.query('medication_logs', 'medicine_id = ?', [medicineId]);
    return results.map((row: any) => this.mapRowToMedicationLog(row));
  }

  /**
   * Get medication logs for a specific date
   */
  async getMedicationLogsByDate(userId: string, date: string): Promise<MedicationLog[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const results = await sqliteService.query(
      'medication_logs',
      'user_id = ? AND scheduled_time >= ? AND scheduled_time <= ?',
      [userId, startOfDay.toISOString(), endOfDay.toISOString()]
    );
    return results.map((row: any) => this.mapRowToMedicationLog(row));
  }

  /**
   * Get today's medication logs for a user
   */
  async getTodayMedicationLogs(userId: string): Promise<MedicationLog[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getMedicationLogsByDate(userId, today);
  }

  /**
   * Add item to sync queue
   */
  async addToSyncQueue(item: SyncQueueItem): Promise<void> {
    await sqliteService.insert('sync_queue', {
      id: item.id,
      entity_type: item.entityType,
      entity_id: item.entityId,
      action: item.action,
      data: JSON.stringify(item.data),
      retry_count: item.retryCount,
      last_error: item.lastError || null,
      created_at: item.createdAt,
      processed_at: item.processedAt || null,
    });
  }

  /**
   * Get pending sync queue items
   */
  async getPendingSyncQueueItems(): Promise<SyncQueueItem[]> {
    const results = await sqliteService.query('sync_queue', 'processed_at IS NULL', []);
    return results.map((row: any) => this.mapRowToSyncQueueItem(row));
  }

  /**
   * Mark sync queue item as processed
   */
  async markSyncQueueItemProcessed(id: string): Promise<void> {
    await sqliteService.update(
      'sync_queue',
      { processed_at: new Date().toISOString() },
      'id = ?',
      [id]
    );
  }

  /**
   * Update sync queue item retry count and error
   */
  async updateSyncQueueItemRetry(id: string, error: string): Promise<void> {
    const item = await this.getSyncQueueItemById(id);
    if (item) {
      await sqliteService.update(
        'sync_queue',
        {
          retry_count: item.retryCount + 1,
          last_error: error,
        },
        'id = ?',
        [id]
      );
    }
  }

  /**
   * Get sync queue item by ID
   */
  async getSyncQueueItemById(id: string): Promise<SyncQueueItem | null> {
    const results = await sqliteService.query('sync_queue', 'id = ?', [id]);
    if (results.length === 0) return null;
    return this.mapRowToSyncQueueItem(results[0]);
  }

  /**
   * Map database row to Medicine object
   */
  private mapRowToMedicine(row: any): Medicine {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      dosage: row.dosage,
      frequency: row.frequency,
      timings: JSON.parse(row.timings),
      startDate: row.start_date,
      endDate: row.end_date,
      instructions: row.instructions,
      stockCount: row.stock_count,
      refillThreshold: row.refill_threshold,
      medicineType: row.medicine_type,
      category: row.category,
      expiryDate: row.expiry_date,
      isActive: row.is_active === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      syncedAt: row.synced_at,
      localOnly: row.local_only === 1,
    };
  }

  /**
   * Map database row to MedicationLog object
   */
  private mapRowToMedicationLog(row: any): MedicationLog {
    return {
      id: row.id,
      medicineId: row.medicine_id,
      userId: row.user_id,
      scheduledTime: row.scheduled_time,
      takenTime: row.taken_time,
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at,
      syncedAt: row.synced_at,
      localOnly: row.local_only === 1,
    };
  }

  /**
   * Map database row to SyncQueueItem object
   */
  private mapRowToSyncQueueItem(row: any): SyncQueueItem {
    return {
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      action: row.action,
      data: JSON.parse(row.data),
      retryCount: row.retry_count,
      lastError: row.last_error,
      createdAt: row.created_at,
      processedAt: row.processed_at,
    };
  }
}

// Export singleton instance
export const medicationRepository = new MedicationRepository();
