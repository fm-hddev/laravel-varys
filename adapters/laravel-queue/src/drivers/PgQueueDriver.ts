import type { Pool } from 'pg';

import type { FailedJobRow, QueueCount } from './types.js';

export type { FailedJobRow, QueueCount };

export interface PgQueueDriverOptions {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

/**
 * PostgreSQL queue driver using `pg.Pool` for connection resilience.
 * A Pool survives individual connection drops between tests.
 */
export class PgQueueDriver {
  private pool: Pool | null = null;
  private schemaReady = false;
  private readonly options: PgQueueDriverOptions;

  constructor(options: PgQueueDriverOptions) {
    this.options = options;
  }

  private async getPool(): Promise<Pool> {
    if (this.pool) return this.pool;

    const { Pool } = await import('pg');
    this.pool = new Pool({
      host: this.options.host,
      port: this.options.port,
      database: this.options.database,
      user: this.options.user,
      password: this.options.password,
      max: 2,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
    });
    return this.pool;
  }

  private async ensureSchema(): Promise<void> {
    if (this.schemaReady) return;
    const pool = await this.getPool();
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS jobs (
          id BIGSERIAL PRIMARY KEY,
          queue VARCHAR(255) NOT NULL,
          payload TEXT NOT NULL,
          attempts SMALLINT NOT NULL DEFAULT 0,
          reserved_at INTEGER,
          available_at INTEGER NOT NULL,
          created_at INTEGER NOT NULL
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS failed_jobs (
          id BIGSERIAL PRIMARY KEY,
          uuid VARCHAR(255) NOT NULL,
          connection TEXT NOT NULL,
          queue TEXT NOT NULL,
          payload TEXT NOT NULL,
          exception TEXT NOT NULL,
          failed_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      this.schemaReady = true;
    } finally {
      client.release();
    }
  }

  async probe(): Promise<boolean> {
    try {
      const pool = await this.getPool();
      const client = await pool.connect();
      try {
        await client.query('SELECT 1');
        await this.ensureSchema();
        return true;
      } finally {
        client.release();
      }
    } catch {
      return false;
    }
  }

  async getQueueCounts(): Promise<QueueCount[]> {
    await this.ensureSchema();
    const pool = await this.getPool();
    const res = await pool.query<{ queue: string; count: string }>(
      'SELECT queue, COUNT(*) as count FROM jobs GROUP BY queue',
    );
    return res.rows.map((r) => ({ queue: r.queue, count: Number(r.count) }));
  }

  async getFailedJobs(limit = 50): Promise<FailedJobRow[]> {
    await this.ensureSchema();
    const pool = await this.getPool();
    const res = await pool.query<FailedJobRow>(
      'SELECT * FROM failed_jobs ORDER BY id DESC LIMIT $1',
      [limit],
    );
    return res.rows;
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
    const pool = await this.getPool();
    for (const row of rows) {
      await pool.query(
        'INSERT INTO jobs (queue, payload, attempts, available_at, created_at) VALUES ($1, $2, $3, $4, $5)',
        [row.queue, row.payload, row.attempts, row.available_at, row.created_at],
      );
    }
  }

  async insertFailedJobs(rows: FailedJobRow[]): Promise<void> {
    await this.ensureSchema();
    const pool = await this.getPool();
    for (const row of rows) {
      await pool.query(
        'INSERT INTO failed_jobs (uuid, connection, queue, payload, exception, failed_at) VALUES ($1, $2, $3, $4, $5, $6)',
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
