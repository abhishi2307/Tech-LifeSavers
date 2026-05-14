import * as SQLite from 'expo-sqlite';

/**
 * SQLite database service for offline medication storage
 * Provides a clean interface for database operations
 */
class SQLiteService {
  private db: SQLite.SQLiteDatabase | null = null;
  private readonly DB_NAME = 'medipulse.db';
  private readonly DB_VERSION = 1;

  /**
   * Initialize database connection and create tables
   */
  async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(this.DB_NAME);
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Create database tables for medications and reminders
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync(`
      PRAGMA journal_mode = WAL;
      
      CREATE TABLE IF NOT EXISTS medicines (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        dosage TEXT NOT NULL,
        frequency TEXT NOT NULL,
        timings TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT,
        instructions TEXT,
        stock_count INTEGER DEFAULT 0,
        refill_threshold INTEGER DEFAULT 5,
        medicine_type TEXT NOT NULL,
        category TEXT,
        expiry_date TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced_at TEXT,
        local_only INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS medication_logs (
        id TEXT PRIMARY KEY,
        medicine_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        scheduled_time TEXT NOT NULL,
        taken_time TEXT,
        status TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL,
        synced_at TEXT,
        local_only INTEGER DEFAULT 0,
        FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        action TEXT NOT NULL,
        data TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0,
        last_error TEXT,
        created_at TEXT NOT NULL,
        processed_at TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_medicines_user_id ON medicines(user_id);
      CREATE INDEX IF NOT EXISTS idx_medicines_is_active ON medicines(is_active);
      CREATE INDEX IF NOT EXISTS idx_medication_logs_user_id ON medication_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_medication_logs_medicine_id ON medication_logs(medicine_id);
      CREATE INDEX IF NOT EXISTS idx_medication_logs_scheduled_time ON medication_logs(scheduled_time);
      CREATE INDEX IF NOT EXISTS idx_medication_logs_status ON medication_logs(status);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON sync_queue(entity_type, entity_id);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_created_at ON sync_queue(created_at);
    `);
  }

  /**
   * Execute a raw SQL query
   */
  async executeQuery(query: string, params: any[] = []): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      return await this.db.execAsync(query);
    } catch (error) {
      console.error('Query execution failed:', error);
      throw error;
    }
  }

  /**
   * Insert a record into a table
   */
  async insert(table: string, data: Record<string, any>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);

    const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
    await this.db.runAsync(query, values);
  }

  /**
   * Update records in a table
   */
  async update(
    table: string,
    data: Record<string, any>,
    where: string,
    whereParams: any[] = []
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const setClause = Object.keys(data)
      .map((key) => `${key} = ?`)
      .join(', ');
    const values = [...Object.values(data), ...whereParams];

    const query = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
    await this.db.runAsync(query, values);
  }

  /**
   * Delete records from a table
   */
  async delete(table: string, where: string, params: any[] = []): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `DELETE FROM ${table} WHERE ${where}`;
    await this.db.runAsync(query, params);
  }

  /**
   * Query records from a table
   */
  async query(table: string, where: string = '', params: any[] = []): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    const query = where 
      ? `SELECT * FROM ${table} WHERE ${where}`
      : `SELECT * FROM ${table}`;

    const result = await this.db.getAllAsync(query, params);
    return result as any[];
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}

// Export singleton instance
export const sqliteService = new SQLiteService();
