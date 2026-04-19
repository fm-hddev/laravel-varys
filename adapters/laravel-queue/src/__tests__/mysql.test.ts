import { GenericContainer, Wait } from 'testcontainers';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { LaravelQueueAdapter } from '../LaravelQueueAdapter.js';

describe('LaravelQueueAdapter — MySQL driver (Testcontainers)', () => {
  let container: Awaited<ReturnType<GenericContainer['start']>>;
  let adapter: LaravelQueueAdapter;

  beforeAll(async () => {
    // mariadb avoids MySQL 8 caching_sha2_password auth issues with mysql2
    container = await new GenericContainer('mariadb:10.11')
      .withEnvironment({
        MARIADB_ROOT_PASSWORD: 'secret',
        MARIADB_DATABASE: 'varys_test',
      })
      .withExposedPorts(3306)
      .withHealthCheck({
        test: ['CMD', 'healthcheck.sh', '--connect', '--innodb_initialized'],
        interval: 2_000_000_000,
        timeout: 5_000_000_000,
        retries: 30,
        startPeriod: 2_000_000_000,
      })
      .withWaitStrategy(Wait.forHealthCheck())
      .start();

    adapter = new LaravelQueueAdapter({
      driver: 'mysql',
      mysql: {
        host: '127.0.0.1',
        port: container.getMappedPort(3306),
        database: 'varys_test',
        user: 'root',
        password: 'secret',
        // MariaDB uses root with native password — no extra flags needed
      },
    });
  }, 90_000);

  afterAll(async () => {
    await adapter.destroy();
    await container.stop();
  }, 30_000);

  it('probe() returns available:true', async () => {
    const result = await adapter.probe();
    expect(result.available).toBe(true);
  });

  it('getQueueStats() returns empty queues on fresh schema', async () => {
    const stats = await adapter.getQueueStats();
    expect(stats.driver).toBe('database');
    expect(stats.queues).toEqual([]);
  });

  it('getQueueStats() counts jobs by queue after seed', async () => {
    await adapter.seed([
      { queue: 'default', payload: '{}', attempts: 0, available_at: 0, created_at: 0 },
      { queue: 'default', payload: '{}', attempts: 0, available_at: 0, created_at: 0 },
      { queue: 'high', payload: '{}', attempts: 0, available_at: 0, created_at: 0 },
    ]);

    const stats = await adapter.getQueueStats();
    const defaultQ = stats.queues.find((q) => q.name === 'default');
    const highQ = stats.queues.find((q) => q.name === 'high');

    expect(defaultQ?.pending).toBe(2);
    expect(highQ?.pending).toBe(1);
  });

  it('listFailedJobs() returns failed jobs', async () => {
    await adapter.seedFailed([
      {
        uuid: 'uuid-mysql-1',
        connection: 'database',
        queue: 'default',
        payload: JSON.stringify({ displayName: 'MysqlJob' }),
        exception: 'PDOException: MySQL error',
        failed_at: '2024-01-01 00:00:00',
      },
    ]);

    const jobs = await adapter.listFailedJobs();
    expect(jobs.length).toBeGreaterThanOrEqual(1);
    const job = jobs.find((j) => j.exception.includes('MySQL error'));
    expect(job).toBeDefined();
    expect(job?.queue).toBe('default');
  });
}, 90_000);
