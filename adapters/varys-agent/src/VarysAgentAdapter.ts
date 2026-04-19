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

export interface VarysAgentAdapterOptions {
  /** Base URL of the target Laravel project (e.g. "http://localhost:8000") */
  baseUrl: string;
  /** Probe timeout in milliseconds — defaults to 2000 */
  probeTimeoutMs?: number;
}

/**
 * Optional adapter that communicates with the `/_varys` HTTP endpoints
 * installed by the Varys Laravel package in the target project.
 *
 * This adapter is entirely optional — its absence does not block any other view.
 * Uses native Node 20 fetch. No external HTTP library.
 */
export class VarysAgentAdapter implements DataSourceAdapter {
  readonly id = 'varys-agent';
  readonly name = 'VarysAgentAdapter';

  private readonly baseUrl: string;
  private readonly probeTimeoutMs: number;

  constructor(options: VarysAgentAdapterOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.probeTimeoutMs = options.probeTimeoutMs ?? 2000;
  }

  async probe(): Promise<ProbeResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.probeTimeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/_varys/ping`, { signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) {
        return { available: false, reason: `HTTP ${res.status}` };
      }

      const body: unknown = await res.json();
      const isVarys =
        typeof body === 'object' && body !== null && (body as Record<string, unknown>)['varys'] === true;

      return isVarys ? { available: true } : { available: false, reason: 'Missing varys:true in ping response' };
    } catch (err) {
      clearTimeout(timer);
      const reason = err instanceof Error ? err.message : String(err);
      return { available: false, reason };
    }
  }

  /**
   * Retry a failed job via POST `/_varys/jobs/:id/retry`.
   * Throws if the server returns a non-ok response.
   */
  async retryFailedJob(jobId: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/_varys/jobs/${jobId}/retry`, {
      method: 'POST',
    });
    if (!res.ok) {
      throw new Error(`Failed to retry job ${jobId}: HTTP ${res.status}`);
    }
  }

  /**
   * Fetch a snapshot of all registered routes from `/_varys/routes`.
   */
  async getRoutesSnapshot(): Promise<unknown> {
    const res = await fetch(`${this.baseUrl}/_varys/routes`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      throw new Error(`Failed to get routes: HTTP ${res.status}`);
    }
    return res.json();
  }

  /**
   * Fetch a snapshot of the scheduled tasks from `/_varys/scheduler`.
   */
  async getSchedulerSnapshot(): Promise<unknown> {
    const res = await fetch(`${this.baseUrl}/_varys/scheduler`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      throw new Error(`Failed to get scheduler: HTTP ${res.status}`);
    }
    return res.json();
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
