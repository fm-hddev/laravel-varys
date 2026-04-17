import { exec } from 'node:child_process';

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

const VITE_PORT = 5173;

/**
 * Checks if port 5173 is in use via `lsof -i :5173`.
 * Resolves with the PID if found, null otherwise.
 */
function checkPort(): Promise<number | null> {
  return new Promise((resolve) => {
    exec(`lsof -i :${VITE_PORT}`, (err, stdout) => {
      if (err || !stdout.trim()) {
        resolve(null);
        return;
      }
      // Parse PID from lsof output (second column after header)
      const lines = stdout.trim().split('\n').slice(1); // skip header
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pidStr = parts[1];
        if (pidStr !== undefined) {
          const pid = parseInt(pidStr, 10);
          if (!Number.isNaN(pid)) {
            resolve(pid);
            return;
          }
        }
      }
      resolve(null);
    });
  });
}

/**
 * Checks if a `vite` or `npm run dev` process exists via `ps aux`.
 * Resolves with the PID if found, null otherwise.
 */
function checkPsAux(): Promise<number | null> {
  return new Promise((resolve) => {
    exec('ps aux', (err, stdout) => {
      if (err) {
        resolve(null);
        return;
      }
      for (const line of stdout.split('\n')) {
        if (line.includes('grep')) continue;
        if (line.includes('vite') || line.includes('npm run dev')) {
          const parts = line.trim().split(/\s+/);
          const pidStr = parts[1];
          if (pidStr !== undefined) {
            const pid = parseInt(pidStr, 10);
            if (!Number.isNaN(pid)) {
              resolve(pid);
              return;
            }
          }
        }
      }
      resolve(null);
    });
  });
}

/**
 * Adapter that detects a running Vite dev server by:
 * 1. Checking if port 5173 is in use (`lsof -i :5173`)
 * 2. Checking for a `vite` / `npm run dev` process in `ps aux`
 *
 * Returns at most 1 Process. streamLog is a no-op for v1.
 */
export class ViteProcessAdapter implements DataSourceAdapter {
  readonly id = 'vite-process';
  readonly name = 'ViteProcessAdapter';

  probe(): Promise<ProbeResult> {
    return this.listProcesses().then((processes) => {
      if (processes.length > 0) {
        return { available: true };
      }
      return { available: false, reason: 'No Vite process or port 5173 detected' };
    });
  }

  listProcesses(): Promise<Process[]> {
    return Promise.all([checkPort(), checkPsAux()]).then(([portPid, psPid]) => {
      const pid = portPid ?? psPid ?? null;
      if (pid === null) return [];
      return [
        {
          id: `vite-${pid}`,
          name: 'vite',
          type: 'vite',
          status: 'up',
          pid,
          adapterSource: 'vite-process',
        },
      ];
    });
  }

  streamLog(_target: StreamTarget, _onLine: (line: LogLine) => void): Promise<Unsubscribe> {
    // v1: no reliable stdout attachment for running Vite processes.
    console.warn('[ViteProcessAdapter] streamLog: log streaming not available in v1');
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
