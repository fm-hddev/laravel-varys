import { Redis } from 'ioredis';
import { GenericContainer, Wait } from 'testcontainers';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ReverbRedisAdapter } from '../ReverbRedisAdapter.js';

describe('ReverbRedisAdapter (Testcontainers Redis)', () => {
  let redisPort: number;
  let publisher: Redis;
  let container: Awaited<ReturnType<GenericContainer['start']>>;

  beforeAll(async () => {
    container = await new GenericContainer('redis:7-alpine')
      .withExposedPorts(6379)
      .withWaitStrategy(Wait.forLogMessage('Ready to accept connections'))
      .start();

    redisPort = container.getMappedPort(6379);
    publisher = new Redis({ host: '127.0.0.1', port: redisPort, lazyConnect: true });
    await publisher.connect();
  }, 60_000);

  afterAll(async () => {
    await publisher.quit();
    await container.stop();
  }, 30_000);

  it('probe() returns available:true when Redis is reachable', async () => {
    const adapter = new ReverbRedisAdapter({
      host: '127.0.0.1',
      port: redisPort,
      channel: 'reverb',
    });
    const result = await adapter.probe();
    expect(result.available).toBe(true);
  });

  it('probe() returns available:false when Redis is unreachable', async () => {
    const adapter = new ReverbRedisAdapter({
      host: '127.0.0.1',
      port: 1,
      channel: 'reverb',
    });
    const result = await adapter.probe();
    expect(result.available).toBe(false);
  });

  it('streamBroadcasts() receives and normalizes 3 published broadcasts', async () => {
    const adapter = new ReverbRedisAdapter({
      host: '127.0.0.1',
      port: redisPort,
      channel: 'reverb',
    });

    const received: import('@varys/core').Broadcast[] = [];
    const unsubscribe = await adapter.streamBroadcasts((broadcast) => {
      received.push(broadcast);
    });

    // Give subscriber a moment to connect
    await new Promise((r) => setTimeout(r, 200));

    const messages = [
      { event: 'App\\Events\\OrderShipped', channel: 'orders', data: { orderId: 1 } },
      { event: 'App\\Events\\PaymentProcessed', channel: 'payments', data: { amount: 99 } },
      { event: 'App\\Events\\UserLoggedIn', channel: 'users', data: { userId: 7 } },
    ];

    for (const msg of messages) {
      await publisher.publish('reverb', JSON.stringify(msg));
    }

    // Wait for all messages to be received
    await new Promise((r) => setTimeout(r, 500));

    void unsubscribe();

    expect(received).toHaveLength(3);
    expect(received[0]?.event).toBe('App\\Events\\OrderShipped');
    expect(received[0]?.channel).toBe('orders');
    expect(received[0]?.payload).toEqual({ orderId: 1 });
    expect(received[0]?.id).toBeTruthy();
    expect(received[0]?.receivedAt).toBeInstanceOf(Date);

    expect(received[1]?.event).toBe('App\\Events\\PaymentProcessed');
    expect(received[2]?.event).toBe('App\\Events\\UserLoggedIn');
  }, 30_000);

  it('streamBroadcasts() ignores malformed messages', async () => {
    const adapter = new ReverbRedisAdapter({
      host: '127.0.0.1',
      port: redisPort,
      channel: 'reverb',
    });

    const received: import('@varys/core').Broadcast[] = [];
    const errors: unknown[] = [];
    const unsubscribe = await adapter.streamBroadcasts(
      (broadcast) => received.push(broadcast),
      (err) => errors.push(err),
    );

    await new Promise((r) => setTimeout(r, 200));

    await publisher.publish('reverb', 'not-json');
    await publisher.publish('reverb', JSON.stringify({ event: 'valid', channel: 'ch', data: {} }));

    await new Promise((r) => setTimeout(r, 500));

    void unsubscribe();

    expect(received).toHaveLength(1);
    expect(errors).toHaveLength(1);
  }, 30_000);
});
