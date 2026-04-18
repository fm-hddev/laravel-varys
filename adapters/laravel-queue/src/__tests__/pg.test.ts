import { GenericContainer, Wait } from 'testcontainers';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { LaravelQueueAdapter } from '../LaravelQueueAdapter.js';

describe('LaravelQueueAdapter — PostgreSQL driver (Testcontainers)', () => {
  let container: Awaited<ReturnType<GenericContainer['start']>>;
  let adapter: LaravelQueueAdapter;

  beforeAll(async () => {
    container = await new GenericContainer('postgres:16-alpine')
      .withEnvironment({
        POSTGRES_PASSWORD: 'secret',
        POSTGRES_DB: 'varys_test',
      })
      .withExposedPorts(5432)
      .withHealthCheck({
        test: ['CMD', 'pg_isready', '-U', 'postgres'],
        interval: 2_000_000_000,
        timeout: 5_000_000_000,
        retries: 30,
        startPeriod: 2_000_000_000,
      })
      .withWaitStrategy(Wait.forHealthCheck())
      .start();

    adapter = new LaravelQueueAdapter({
      driver: 'pgsql',
      pgsql: {
        host: '127.0.0.1',
        port: container.getMappedPort(5432),
        database: 'varys_test',
        user: 'postgres',
        password: 'secret',
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

  it('getQueueStats() returns empty on fresh schema', async () => {
    const stats = await adapter.getQueueStats();
    expect(stats.driver).toBe('database');
    expect(stats.queues).toEqual([]);
  });

  it('getQueueStats() counts jobs by queue', async () => {
    await adapter.seed([
      { queue: 'default', payload: '{}', attempts: 0, available_at: 0, created_at: 0 },
      { queue: 'notifications', payload: '{}', attempts: 0, available_at: 0, created_at: 0 },
    ]);

    const stats = await adapter.getQueueStats();
    const defaultQ = stats.queues.find((q) => q.name === 'default');
    const notifQ = stats.queues.find((q) => q.name === 'notifications');

    expect(defaultQ?.pending).toBe(1);
    expect(notifQ?.pending).toBe(1);
  });

  it('listFailedJobs() returns failed jobs', async () => {
    await adapter.seedFailed([
      {
        uuid: 'uuid-pg-1',
        connection: 'database',
        queue: 'default',
        payload: JSON.stringify({ displayName: 'PgJob' }),
        exception: 'QueryException: PG error',
        failed_at: '2024-01-01 00:00:00',
      },
    ]);

    const jobs = await adapter.listFailedJobs();
    expect(jobs.length).toBeGreaterThanOrEqual(1);
    const job = jobs.find((j) => j.exception.includes('PG error'));
    expect(job).toBeDefined();
  });
}, 90_000);
