import { exec, spawn } from 'node:child_process';
import { createHmac, randomUUID } from 'node:crypto';
import path from 'node:path';

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
import { WebSocket } from 'ws';
import type { RawData } from 'ws';

export interface ReverbWebSocketAdapterOptions {
  host: string;
  port: number;
  appId: string;
  appKey: string;
  appSecret: string;
  scheme?: 'ws' | 'wss';
  /**
   * Absolute path to the Laravel project root. Used to monitor
   * `storage/logs/laravel-YYYY-MM-DD.log` for channel discovery via
   * broadcasting auth requests.
   */
  projectPath?: string;
  /**
   * @deprecated No longer used.
   */
  composeProjectName?: string;
}

/** @deprecated Use ReverbWebSocketAdapterOptions */
export type ReverbRedisAdapterOptions = ReverbWebSocketAdapterOptions;

const INTERNAL_EVENT_PREFIX = 'pusher:';

/**
 * Adapter that connects to a Laravel Reverb server via the Pusher WebSocket
 * protocol and streams broadcast events in real-time.
 *
 * Channel discovery works by monitoring the Laravel application log file for
 * `POST /broadcasting/auth` requests. These requests contain the full channel
 * name and are logged each time a browser client subscribes to a private
 * channel.
 */
export class ReverbRedisAdapter implements DataSourceAdapter {
  readonly id = 'reverb-redis';
  readonly name = 'ReverbRedisAdapter';

  private readonly options: Required<ReverbWebSocketAdapterOptions>;

  constructor(options: ReverbWebSocketAdapterOptions) {
    this.options = {
      host: options.host,
      port: options.port,
      appId: options.appId,
      appKey: options.appKey,
      appSecret: options.appSecret,
      scheme: options.scheme ?? 'ws',
      projectPath: options.projectPath ?? '',
      composeProjectName: options.composeProjectName ?? '',
    };
  }

  // ---------------------------------------------------------------------------
  // Pusher auth for private channels
  // ---------------------------------------------------------------------------

  private computeChannelAuth(socketId: string, channel: string): string {
    const stringToSign = `${socketId}:${channel}`;
    const signature = createHmac('sha256', this.options.appSecret).update(stringToSign).digest('hex');
    return `${this.options.appKey}:${signature}`;
  }

  // ---------------------------------------------------------------------------
  // Laravel log-based channel discovery
  // ---------------------------------------------------------------------------

  private todayLogPath(): string {
    const today = new Date().toISOString().slice(0, 10);
    return path.join(this.options.projectPath, 'storage', 'logs', `laravel-${today}.log`);
  }

  private extractChannelsFromLine(line: string): string[] {
    const results: string[] = [];
    const re = /"channel_name":"([^"]+)"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line)) !== null) {
      if (m[1]) results.push(m[1]);
    }
    return results;
  }

  private readLastLines(filePath: string, n: number): Promise<string[]> {
    return new Promise((resolve) => {
      exec(`tail -n ${n} "${filePath}"`, (err, stdout) => {
        if (err) { resolve([]); return; }
        resolve(stdout.split('\n').filter(Boolean));
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  async probe(): Promise<ProbeResult> {
    const { scheme, host, port, appKey } = this.options;
    const wsUrl = `${scheme}://${host}:${port}/app/${appKey}`;
    return new Promise((resolve) => {
      const ws = new WebSocket(wsUrl);
      const cleanup = (result: ProbeResult) => {
        ws.removeAllListeners();
        ws.terminate();
        resolve(result);
      };
      ws.once('open', () => cleanup({ available: true }));
      ws.once('message', () => cleanup({ available: true }));
      ws.once('error', (err) => cleanup({ available: false, reason: err.message }));
    });
  }

  async streamBroadcasts(
    onBroadcast: (broadcast: Broadcast) => void,
    onError?: (err: unknown) => void,
  ): Promise<Unsubscribe> {
    const { scheme, host, port, appKey } = this.options;
    const wsUrl = `${scheme}://${host}:${port}/app/${appKey}`;

    const ws = new WebSocket(wsUrl);
    let socketId: string | null = null;
    const subscribedChannels = new Set<string>();
    let logTailProcess: ReturnType<typeof spawn> | null = null;
    let destroyed = false;

    const subscribeToChannel = (channel: string): void => {
      if (subscribedChannels.has(channel)) return;
      if (ws.readyState !== WebSocket.OPEN || !socketId) return;

      const data: Record<string, string> = { channel };
      if (channel.startsWith('private-') || channel.startsWith('presence-')) {
        data['auth'] = this.computeChannelAuth(socketId, channel);
      }

      ws.send(JSON.stringify({ event: 'pusher:subscribe', data }));
      subscribedChannels.add(channel);
    };

    const startLaravelLogMonitor = async (): Promise<void> => {
      if (!this.options.projectPath || destroyed) return;

      const logPath = this.todayLogPath();

      const recentLines = await this.readLastLines(logPath, 500);
      for (const line of recentLines) {
        for (const ch of this.extractChannelsFromLine(line)) {
          subscribeToChannel(ch);
        }
      }

      logTailProcess = spawn('tail', ['-f', '-n', '0', logPath]);

      logTailProcess.stdout?.on('data', (chunk: Buffer) => {
        if (destroyed) return;
        for (const ch of this.extractChannelsFromLine(chunk.toString())) {
          subscribeToChannel(ch);
        }
      });

      logTailProcess.on('error', (err) => {
        if (onError) onError(err);
      });
    };

    // Attach message handler BEFORE awaiting open so pusher:connection_established
    // is never missed even if it arrives in the same TCP packet as the handshake.
    ws.on('message', (raw: RawData) => {
      try {
        const text = Buffer.isBuffer(raw) ? raw.toString('utf-8') : String(raw);
        const msg = JSON.parse(text) as { event?: string; channel?: string; data?: unknown };
        const event = msg.event ?? '';

        if (event === 'pusher:connection_established') {
          const connData = typeof msg.data === 'string'
            ? (JSON.parse(msg.data) as { socket_id?: string })
            : (msg.data as { socket_id?: string });
          socketId = connData?.socket_id ?? null;
          void startLaravelLogMonitor();
          return;
        }

        if (event === 'pusher:ping') {
          ws.send(JSON.stringify({ event: 'pusher:pong', data: {} }));
          return;
        }

        if (event.startsWith(INTERNAL_EVENT_PREFIX)) return;
        if (!event || !msg.channel) return;

        let payload: unknown = msg.data;
        if (typeof payload === 'string') {
          try { payload = JSON.parse(payload); } catch { /* keep as string */ }
        }

        onBroadcast({
          id: randomUUID(),
          channel: msg.channel,
          event,
          payload,
          receivedAt: new Date(),
        });
      } catch (err) {
        if (onError) onError(err);
      }
    });

    ws.on('error', (err) => {
      if (onError) onError(err);
    });

    await new Promise<void>((resolve, reject) => {
      if (ws.readyState === WebSocket.OPEN) { resolve(); return; }
      ws.once('open', () => resolve());
      ws.once('error', (err) => reject(err));
    });

    return () => {
      destroyed = true;
      logTailProcess?.kill();
      ws.close();
    };
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

  getQueueStats(): Promise<QueueStats> {
    return Promise.resolve({ driver: 'database', queues: [] });
  }

  listFailedJobs(): Promise<FailedJob[]> {
    return Promise.resolve([]);
  }
}
