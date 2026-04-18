import { Redis } from 'ioredis';
import { GenericContainer, Wait } from 'testcontainers';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { LaravelQueueAdapter } from '../LaravelQueueAdapter.js';

describe('LaravelQueueAdapter — Redis driver (Testcontainers)', () => {
  let container: Awaited<ReturnType<GenericContainer['start']>>;
  let adapter: LaravelQueueAdapter;
  let redis: Redis;

  beforeAll(async () => {
    container = await new GenericContainer('redis:7-alpine')
      .withExposedPorts(6379)
      .withWaitStrategy(Wait.forLogMessage('Ready to accept connections'))
      .start();

    const port = container.getMappedPort(6379);

    adapter = new LaravelQueueAdapter({
      driver: 'redis',
      redis: {
        host: '127.0.0.1',
        port,
        queues: ['default', 'notifications'],
      },
    });

    redis = new Redis({ host: '127.0.0.1', port, lazyConnect: true });
    await redis.connect();
  }, 60_000);

  afterAll(async () => {
    await adapter.destroy();
    await redis.quit();
    await container.stop();
  }, 30_000);

  it('probe() returns available:true', async () => {
    const result = await adapter.probe();
    expect(result.available).toBe(true);
  });

  it('probe() returns available:false when unreachable', async () => {
    const bad = new LaravelQueueAdapter({
      driver: 'redis',
      redis: { host: '127.0.0.1', port: 1, queues: ['default'] },
    });
    const result = await bad.probe();
    expect(result.available).toBe(false);
  });

  it('getQueueStats() returns 0 for empty queues', async () => {
    const stats = await adapter.getQueueStats();
    expect(stats.driver).toBe('redis');
    const defaultQ = stats.queues.find((q) => q.name === 'default');
    expect(defaultQ?.pending).toBe(0);
  });

  it('getQueueStats() returns LLEN for populated queues', async () => {
    await redis.del('queues:default');
    await redis.lpush('queues:default', '{}', '{}', '{}');

    const stats = await adapter.getQueueStats();
    const defaultQ = stats.queues.find((q) => q.name === 'default');
    expect(defaultQ?.pending).toBe(3);
  });
}, 60_000);
