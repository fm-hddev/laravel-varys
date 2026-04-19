import type { Pool, RowDataPacket } from 'mysql2/promise';
import * as mysql from 'mysql2/promise';

import type { FailedJobRow, QueueCount } from './types.js';

export type { FailedJobRow, QueueCount };

export interface MysqlQueueDriverOptions {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

/**
 * MySQL/MariaDB queue driver using mysql2 pool for connection resilience.
 */
export class MysqlQueueDriver {
  private pool: Pool | null = null;
  private schemaReady = false;
  private readonly options: MysqlQueueDriverOptions;

  constructor(options: MysqlQueueDriverOptions) {
    this.options = options;
  }

  private getPool(): Pool {
    if (this.pool) return this.pool;

    this.pool = mysql.createPool({
      host: this.options.host,
      port: this.options.port,
      database: this.options.database,
      user: this.options.user,
      password: this.options.password,
      connectionLimit: 2,
      connectTimeout: 5_000,
    });
    return this.pool;
  }

  private async ensureSchema(): Promise<void> {
    if (this.schemaReady) return;
    const pool = this.getPool();
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS jobs (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        queue VARCHAR(255) NOT NULL,
        payload LONGTEXT NOT NULL,
        attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
        reserved_at INT UNSIGNED,
        available_at INT UNSIGNED NOT NULL,
        created_at INT UNSIGNED NOT NULL
      )
    `);
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS failed_jobs (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        uuid VARCHAR(255) NOT NULL,
        connection TEXT NOT NULL,
        queue TEXT NOT NULL,
        payload LONGTEXT NOT NULL,
        exception LONGTEXT NOT NULL,
        failed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    this.schemaReady = true;
  }

  async probe(): Promise<boolean> {
    try {
      const pool = this.getPool();
      const [rows] = await pool.execute<RowDataPacket[]>('SELECT 1');
      if (rows.length > 0) {
        await this.ensureSchema();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async getQueueCounts(): Promise<QueueCount[]> {
    await this.ensureSchema();
    const pool = this.getPool();
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT queue, COUNT(*) as count FROM jobs GROUP BY queue',
    );
    return rows.map((r) => ({ queue: r['queue'] as string, count: Number(r['count']) }));
  }

  async getFailedJobs(limit = 50): Promise<FailedJobRow[]> {
    await this.ensureSchema();
    const pool = this.getPool();
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM failed_jobs ORDER BY id DESC LIMIT ?',
      [limit],
    );
    return rows as FailedJobRow[];
  }

  async insertJobs(
    rows: Array<{
      queue: string;
      payload: string;
      attempts: number;
      available_at: number;
      created_at: number;
    }>,
  ): Promise<void> {
    await this.ensureSchema();
    const pool = this.getPool();
    for (const row of rows) {
      await pool.execute(
        'INSERT INTO jobs (queue, payload, attempts, available_at, created_at) VALUES (?, ?, ?, ?, ?)',
        [row.queue, row.payload, row.attempts, row.available_at, row.created_at],
      );
    }
  }

  async insertFailedJobs(rows: FailedJobRow[]): Promise<void> {
    await this.ensureSchema();
    const pool = this.getPool();
    for (const row of rows) {
      await pool.execute(
        'INSERT INTO failed_jobs (uuid, connection, queue, payload, exception, failed_at) VALUES (?, ?, ?, ?, ?, ?)',
        [row.uuid, row.connection, row.queue, row.payload, row.exception, row.failed_at],
      );
    }
  }

  async destroy(): Promise<void> {
    await this.pool?.end();
    this.pool = null;
    this.schemaReady = false;
  }
}
