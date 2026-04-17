import type BetterSqlite3 from 'better-sqlite3';

import type { FailedJobRow, JobRow, QueueCount } from './types.js';

export type { FailedJobRow, JobRow, QueueCount };

/**
 * SQLite queue driver using better-sqlite3 (synchronous).
 * Used for in-memory testing and projects using the SQLite database driver.
 */
export class SqliteQueueDriver {
  private db: InstanceType<typeof BetterSqlite3> | null = null;
  private readonly filename: string;

  constructor(filename: string) {
    this.filename = filename;
  }

  private async getDb(): Promise<InstanceType<typeof BetterSqlite3>> {
    if (this.db) return this.db;

    const BetterSqlite3 = (await import('better-sqlite3')).default;
    this.db = new BetterSqlite3(this.filename);
    this.ensureSchema();
    return this.db;
  }

  private ensureSchema(): void {
    if (!this.db) return;
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        queue TEXT NOT NULL,
        payload TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        reserved_at INTEGER,
        available_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS failed_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT NOT NULL,
        connection TEXT NOT NULL,
        queue TEXT NOT NULL,
        payload TEXT NOT NULL,
        exception TEXT NOT NULL,
        failed_at TEXT NOT NULL
      );
    `);
  }

  async probe(): Promise<boolean> {
    try {
      const db = await this.getDb();
      db.prepare('SELECT 1').get();
      return true;
    } catch {
      return false;
    }
  }

  async getQueueCounts(): Promise<QueueCount[]> {
    const db = await this.getDb();
    return db
      .prepare('SELECT queue, COUNT(*) as count FROM jobs GROUP BY queue')
      .all() as QueueCount[];
  }

  async getFailedJobs(limit = 50): Promise<FailedJobRow[]> {
    const db = await this.getDb();
    return db
      .prepare('SELECT * FROM failed_jobs ORDER BY id DESC LIMIT ?')
      .all(limit) as FailedJobRow[];
  }

  async insertJobs(rows: JobRow[]): Promise<void> {
    const db = await this.getDb();
    const stmt = db.prepare(
      'INSERT INTO jobs (queue, payload, attempts, available_at, created_at) VALUES (?, ?, ?, ?, ?)',
    );
    for (const row of rows) {
      stmt.run(row.queue, row.payload, row.attempts, row.available_at, row.created_at);
    }
  }

  async insertFailedJobs(rows: FailedJobRow[]): Promise<void> {
    const db = await this.getDb();
    const stmt = db.prepare(
      'INSERT INTO failed_jobs (uuid, connection, queue, payload, exception, failed_at) VALUES (?, ?, ?, ?, ?, ?)',
    );
    for (const row of rows) {
      stmt.run(row.uuid, row.connection, row.queue, row.payload, row.exception, row.failed_at);
    }
  }

  destroy(): void {
    this.db?.close();
    this.db = null;
  }
}
