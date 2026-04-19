import { describe, expect, it } from 'vitest';

import { LaravelQueueAdapter } from '../LaravelQueueAdapter.js';

describe('LaravelQueueAdapter — SQLite driver (in-memory)', () => {
  function makeAdapter() {
    return new LaravelQueueAdapter({
      driver: 'sqlite',
      sqlite: { filename: ':memory:' },
    });
  }

  it('probe() returns available:true for in-memory SQLite', async () => {
    const adapter = makeAdapter();
    const result = await adapter.probe();
    expect(result.available).toBe(true);
  });

  it('getQueueStats() returns empty queues on fresh DB', async () => {
    const adapter = makeAdapter();
    const stats = await adapter.getQueueStats();
    expect(stats.driver).toBe('database');
    expect(stats.queues).toEqual([]);
  });

  it('getQueueStats() aggregates pending jobs by queue', async () => {
    const adapter = makeAdapter();
    await adapter.seed([
      { queue: 'default', payload: '{}', attempts: 0, available_at: 0, created_at: 0 },
      { queue: 'default', payload: '{}', attempts: 0, available_at: 0, created_at: 0 },
      { queue: 'emails', payload: '{}', attempts: 0, available_at: 0, created_at: 0 },
    ]);

    const stats = await adapter.getQueueStats();
    const defaultQ = stats.queues.find((q) => q.name === 'default');
    const emailsQ = stats.queues.find((q) => q.name === 'emails');

    expect(defaultQ?.pending).toBe(2);
    expect(emailsQ?.pending).toBe(1);
  });

  it('listFailedJobs() returns the last 50 failed jobs', async () => {
    const adapter = makeAdapter();
    const failedAt = new Date('2024-01-01T00:00:00Z');
    await adapter.seedFailed([
      {
        uuid: 'uuid-1',
        connection: 'database',
        queue: 'default',
        payload: JSON.stringify({ displayName: 'TestJob' }),
        exception: 'RuntimeException: something failed',
        failed_at: failedAt.toISOString(),
      },
    ]);

    const jobs = await adapter.listFailedJobs();
    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.queue).toBe('default');
    expect(jobs[0]?.exception).toBe('RuntimeException: something failed');
    expect(jobs[0]?.failedAt).toBeInstanceOf(Date);
  });
});
