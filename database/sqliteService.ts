import * as SQLite from 'expo-sqlite';

class SQLiteService {
  private db: SQLite.SQLiteDatabase | null = null;
  private readonly DB_NAME = 'medipulse.db';
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    // If already initialized, return immediately
    if (this.initialized) return;

    // If initialization is in progress, wait for it
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._doInit();
    return this.initPromise;
  }

  private async _doInit(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(this.DB_NAME);
      await this.createTables();
      await this.runMigrations();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      this.initPromise = null; // Allow retry on next call
      throw error;
    }
  }

  /** Ensures the DB is initialized before any operation */
  private async ensureReady(): Promise<SQLite.SQLiteDatabase> {
    if (!this.initialized) {
      await this.init();
    }
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

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

  private async runMigrations(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const row = await this.db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    const currentVersion = row?.user_version ?? 0;

    if (currentVersion < 2) {
      const alterColumns = [
        'ALTER TABLE medicines ADD COLUMN precautions TEXT',
        'ALTER TABLE medicines ADD COLUMN allergies TEXT',
        'ALTER TABLE medicines ADD COLUMN interactions TEXT',
      ];
      for (const sql of alterColumns) {
        try { await this.db.runAsync(sql); } catch { /* column already exists */ }
      }

      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS family_members (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          relationship TEXT NOT NULL,
          date_of_birth TEXT,
          phone_number TEXT,
          avatar TEXT,
          is_caregiver INTEGER DEFAULT 0,
          allergies TEXT,
          blood_group TEXT,
          emergency_priority INTEGER DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          synced_at TEXT,
          local_only INTEGER DEFAULT 0
        );

        CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);

        CREATE TABLE IF NOT EXISTS appointments (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          doctor_name TEXT,
          clinic_name TEXT,
          appointment_date TEXT NOT NULL,
          appointment_time TEXT NOT NULL,
          type TEXT NOT NULL,
          notes TEXT,
          reminder_minutes INTEGER DEFAULT 60,
          notification_id TEXT,
          status TEXT DEFAULT 'scheduled',
          location TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          synced_at TEXT,
          local_only INTEGER DEFAULT 0
        );

        CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
        CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);

        CREATE TABLE IF NOT EXISTS documents (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          type TEXT NOT NULL,
          file_uri TEXT NOT NULL,
          file_name TEXT NOT NULL,
          file_size INTEGER,
          thumbnail_uri TEXT,
          notes TEXT,
          tags TEXT,
          created_at TEXT NOT NULL,
          synced_at TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
      `);

      await this.db.runAsync('PRAGMA user_version = 2');
    }
  }

  async insert(table: string, data: Record<string, any>): Promise<void> {
    const db = await this.ensureReady();
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    await db.runAsync(
      `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`,
      Object.values(data)
    );
  }

  async update(
    table: string,
    data: Record<string, any>,
    where: string,
    whereParams: any[] = []
  ): Promise<void> {
    const db = await this.ensureReady();
    const setClause = Object.keys(data).map((k) => `${k} = ?`).join(', ');
    await db.runAsync(
      `UPDATE ${table} SET ${setClause} WHERE ${where}`,
      [...Object.values(data), ...whereParams]
    );
  }

  async delete(table: string, where: string, params: any[] = []): Promise<void> {
    const db = await this.ensureReady();
    await db.runAsync(`DELETE FROM ${table} WHERE ${where}`, params);
  }

  async query(table: string, where: string = '', params: any[] = []): Promise<any[]> {
    const db = await this.ensureReady();
    const sql = where
      ? `SELECT * FROM ${table} WHERE ${where}`
      : `SELECT * FROM ${table}`;
    return (await db.getAllAsync(sql, params)) as any[];
  }

  async queryRaw(sql: string, params: any[] = []): Promise<any[]> {
    const db = await this.ensureReady();
    return (await db.getAllAsync(sql, params)) as any[];
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.initialized = false;
      this.initPromise = null;
    }
  }

  get isReady(): boolean {
    return this.initialized;
  }
}

export const sqliteService = new SQLiteService();
