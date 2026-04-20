import type {
  Broadcast,
  DataSourceAdapter,
  FailedJob,
  LogLine,
  Process,
  ProbeResult,
  QueueStats,
  StreamTarget,
  Unsubscribe,
} from '@varys/core';

import { MysqlQueueDriver } from './drivers/MysqlQueueDriver.js';
import { PgQueueDriver } from './drivers/PgQueueDriver.js';
import { RedisQueueDriver } from './drivers/RedisQueueDriver.js';
import { SqliteQueueDriver } from './drivers/SqliteQueueDriver.js';
import type { FailedJobRow, JobRow } from './drivers/types.js';

export type LaravelQueueAdapterOptions =
  | {
      driver: 'sqlite';
      sqlite: { filename: string };
    }
  | {
      driver: 'mysql';
      mysql: { host: string; port: number; database: string; user: string; password: string };
    }
  | {
      driver: 'pgsql';
      pgsql: { host: string; port: number; database: string; user: string; password: string };
    }
  | {
      driver: 'redis';
      redis: { host: string; port: number; password?: string; queues: string[] };
    };

type AnyDriver = SqliteQueueDriver | MysqlQueueDriver | PgQueueDriver | RedisQueueDriver;

/**
 * Adapter that reads Laravel queue statistics from the active queue backend.
 * Supports SQLite, MySQL, PostgreSQL (database driver) and Redis.
 * Driver is loaded lazily on first use.
 */
export class LaravelQueueAdapter implements DataSourceAdapter {
  readonly id = 'laravel-queue';
  readonly name = 'LaravelQueueAdapter';

  private driver: AnyDriver | null = null;
  private readonly options: LaravelQueueAdapterOptions;

  constructor(options: LaravelQueueAdapterOptions) {
    this.options = options;
  }

  private getDriver(): AnyDriver {
    if (this.driver) return this.driver;

    switch (this.options.driver) {
      case 'sqlite':
        this.driver = new SqliteQueueDriver(this.options.sqlite.filename);
        break;
      case 'mysql':
        this.driver = new MysqlQueueDriver(this.options.mysql);
        break;
      case 'pgsql':
        this.driver = new PgQueueDriver(this.options.pgsql);
        break;
      case 'redis':
        this.driver = new RedisQueueDriver(this.options.redis);
        break;
    }

    return this.driver;
  }

  async probe(): Promise<ProbeResult> {
    const available = await this.getDriver().probe();
    return available ? { available: true } : { available: false, reason: 'Connection failed' };
  }

  async getQueueStats(): Promise<QueueStats> {
    const driver = this.getDriver();

    if (driver instanceof RedisQueueDriver) {
      const counts = await driver.getQueueCounts();
      return {
        driver: 'redis',
        queues: counts.map((c) => ({ name: c.queue, pending: c.count, processing: 0, failed: 0 })),
      };
    }

    const dbDriver = driver;
    const counts = await dbDriver.getQueueCounts();
    return {
      driver: 'database',
      queues: counts.map((c) => ({ name: c.queue, pending: c.count, processing: 0, failed: 0 })),
    };
  }

  async listFailedJobs(): Promise<FailedJob[]> {
    const driver = this.getDriver();

    if (driver instanceof RedisQueueDriver) {
      return [];
    }

    const rows = await driver.getFailedJobs(50);

    return rows.map((row) => {
      let payload: unknown;
      try {
        payload = JSON.parse(row.payload);
      } catch {
        payload = row.payload;
      }

      return {
        id: row.id ?? 0,
        queue: row.queue,
        payload,
        exception: row.exception,
        failedAt: new Date(row.failed_at),
      };
    });
  }

  async forgetFailedJob(id: string | number): Promise<void> {
    const driver = this.getDriver();
    if (driver instanceof RedisQueueDriver) throw new Error('Not supported for Redis driver');
    return driver.forgetFailedJob(id);
  }

  async retryFailedJob(id: string | number): Promise<void> {
    const driver = this.getDriver();
    if (driver instanceof RedisQueueDriver) throw new Error('Not supported for Redis driver');
    return driver.retryFailedJob(id);
  }

  async purgeAllFailedJobs(): Promise<void> {
    const driver = this.getDriver();
    if (driver instanceof RedisQueueDriver) throw new Error('Not supported for Redis driver');
    return driver.purgeAllFailedJobs();
  }

  async destroy(): Promise<void> {
    if (!this.driver) return;
    if (this.driver instanceof SqliteQueueDriver) {
      this.driver.destroy();
    } else {
      await this.driver.destroy();
    }
    this.driver = null;
  }

  /** Test helper: seed jobs table (SQLite/MySQL/PG only) */
  async seed(rows: JobRow[]): Promise<void> {
    const driver = this.getDriver();
    if (driver instanceof SqliteQueueDriver) {
      await driver.insertJobs(rows);
    } else if (driver instanceof MysqlQueueDriver || driver instanceof PgQueueDriver) {
      await driver.insertJobs(rows);
    }
  }

  /** Test helper: seed failed_jobs table (SQLite/MySQL/PG only) */
  async seedFailed(rows: FailedJobRow[]): Promise<void> {
    const driver = this.getDriver();
    if (driver instanceof SqliteQueueDriver) {
      await driver.insertFailedJobs(rows);
    } else if (driver instanceof MysqlQueueDriver || driver instanceof PgQueueDriver) {
      await driver.insertFailedJobs(rows);
    }
  }

  // --- DataSourceAdapter no-ops ---

  listProcesses(): Promise<Process[]> {
    return Promise.resolve([]);
  }

  streamLog(_target: StreamTarget, _onLine: (line: LogLine) => void): Promise<Unsubscribe> {
    return Promise.resolve(() => undefined);
  }

  listBroadcasts(): Promise<Broadcast[]> {
    return Promise.resolve([]);
  }

  resetBroadcastStream(): Promise<void> {
    return Promise.resolve();
  }
}
