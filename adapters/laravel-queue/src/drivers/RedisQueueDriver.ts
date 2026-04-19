import type { Redis } from 'ioredis';
import { Redis as RedisClient } from 'ioredis';

export interface RedisQueueDriverOptions {
  host: string;
  port: number;
  password?: string;
  /** List of known queue names to check */
  queues: string[];
}

export interface QueueCount {
  queue: string;
  count: number;
}

/**
 * Redis queue driver using ioredis.
 * Laravel stores jobs as lists under the key `queues:<name>`.
 */
export class RedisQueueDriver {
  private client: Redis | null = null;
  private readonly options: RedisQueueDriverOptions;

  constructor(options: RedisQueueDriverOptions) {
    this.options = options;
  }

  private async getClient(): Promise<Redis> {
    if (this.client) return this.client;

    this.client = new RedisClient({
      host: this.options.host,
      port: this.options.port,
      password: this.options.password,
      lazyConnect: true,
      maxRetriesPerRequest: 0,
      connectTimeout: 2000,
      enableOfflineQueue: false,
    });
    await this.client.connect();
    return this.client;
  }

  async probe(): Promise<boolean> {
    try {
      const client = await this.getClient();
      const pong = await client.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }

  async getQueueCounts(): Promise<QueueCount[]> {
    const client = await this.getClient();
    const counts: QueueCount[] = [];
    for (const queue of this.options.queues) {
      const count = await client.llen(`queues:${queue}`);
      counts.push({ queue, count });
    }
    return counts;
  }

  forgetFailedJob(_id: string | number): Promise<void> {
    return Promise.reject(new Error('forgetFailedJob is not supported for the Redis driver'));
  }

  retryFailedJob(_id: string | number): Promise<void> {
    return Promise.reject(new Error('retryFailedJob is not supported for the Redis driver'));
  }

  purgeAllFailedJobs(): Promise<void> {
    return Promise.reject(new Error('purgeAllFailedJobs is not supported for the Redis driver'));
  }

  destroy(): void {
    this.client?.disconnect();
    this.client = null;
  }
}
