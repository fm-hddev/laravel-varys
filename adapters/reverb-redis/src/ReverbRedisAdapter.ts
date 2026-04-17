import { randomUUID } from 'node:crypto';

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
import { Redis } from 'ioredis';

import { normalizePayload } from './normalizePayload.js';

export interface ReverbRedisAdapterOptions {
  host: string;
  port: number;
  /** Redis channel name — defaults to "reverb" (matches REVERB_SCALING_CHANNEL) */
  channel?: string;
  password?: string;
}

/**
 * Adapter that subscribes to the Reverb Redis pub/sub channel to stream
 * broadcast events in real-time.
 *
 * Reverb publishes all broadcast messages on a single Redis channel (default: "reverb").
 * Each message is a JSON object: { event, channel, data, socket_id?, application? }
 */
export class ReverbRedisAdapter implements DataSourceAdapter {
  readonly id = 'reverb-redis';
  readonly name = 'ReverbRedisAdapter';

  private readonly options: Required<Pick<ReverbRedisAdapterOptions, 'host' | 'port' | 'channel'>> &
    Pick<ReverbRedisAdapterOptions, 'password'>;

  constructor(options: ReverbRedisAdapterOptions) {
    this.options = {
      host: options.host,
      port: options.port,
      channel: options.channel ?? 'reverb',
      password: options.password,
    };
  }

  async probe(): Promise<ProbeResult> {
    const client = new Redis({
      host: this.options.host,
      port: this.options.port,
      password: this.options.password,
      lazyConnect: true,
      connectTimeout: 2000,
      maxRetriesPerRequest: 0,
      enableOfflineQueue: false,
    });

    try {
      await client.connect();
      const pong = await client.ping();
      return pong === 'PONG' ? { available: true } : { available: false, reason: 'Unexpected PING response' };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      return { available: false, reason };
    } finally {
      client.disconnect();
    }
  }

  async streamBroadcasts(
    onBroadcast: (broadcast: Broadcast) => void,
    onError?: (err: unknown) => void,
  ): Promise<Unsubscribe> {
    const subscriber = new Redis({
      host: this.options.host,
      port: this.options.port,
      password: this.options.password,
      lazyConnect: true,
      maxRetriesPerRequest: 0,
    });

    await subscriber.connect();

    subscriber.on('message', (_channel: string, message: string) => {
      try {
        const normalized = normalizePayload(message);
        const broadcast: Broadcast = {
          id: randomUUID(),
          channel: normalized.channel,
          event: normalized.event,
          payload: normalized.data,
          receivedAt: new Date(),
        };
        onBroadcast(broadcast);
      } catch (err) {
        if (onError) {
          onError(err);
        }
      }
    });

    await subscriber.subscribe(this.options.channel);

    return () => {
      subscriber.disconnect();
    };
  }

  // --- DataSourceAdapter no-ops (not relevant for this adapter) ---

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

  getQueueStats(): Promise<QueueStats> {
    return Promise.resolve({ driver: 'database', queues: [] });
  }

  listFailedJobs(): Promise<FailedJob[]> {
    return Promise.resolve([]);
  }
}
