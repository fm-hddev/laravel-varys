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

/** Artisan command patterns we care about */
const ARTISAN_COMMANDS = ['queue:work', 'schedule:work', 'reverb:start', 'serve'] as const;

interface PsLine {
  pid: number;
  command: string;
}

/**
 * Parses `ps aux` output lines containing 'php artisan'.
 * Skips the `grep` process itself.
 * Returns { pid, command } for each match.
 */
function parsePsAux(output: string): PsLine[] {
  const results: PsLine[] = [];
  for (const line of output.split('\n')) {
    if (!line.includes('php artisan')) continue;
    if (line.includes('grep')) continue;
    const parts = line.trim().split(/\s+/);
    // Format: USER PID %CPU %MEM ... COMMAND
    // PID is the second column (index 1)
    const pidStr = parts[1];
    if (pidStr === undefined) continue;
    const pid = parseInt(pidStr, 10);
    if (Number.isNaN(pid)) continue;
    // Command starts at index 10 on macOS ps aux
    const command = parts.slice(10).join(' ');
    results.push({ pid, command });
  }
  return results;
}

/**
 * Adapter that detects Laravel Artisan processes via `ps aux | grep 'php artisan'`.
 * streamLog is best-effort no-op for v1 — stdout attachment is not reliably available
 * for already-running processes without attaching at spawn time.
 */
export class ArtisanProcessAdapter implements DataSourceAdapter {
  readonly id = 'artisan-process';
  readonly name = 'ArtisanProcessAdapter';

  probe(): Promise<ProbeResult> {
    return new Promise((resolve) => {
      exec('which php', (err) => {
        if (err) {
          resolve({ available: false, reason: 'php not found in PATH' });
        } else {
          resolve({ available: true });
        }
      });
    });
  }

  listProcesses(): Promise<Process[]> {
    return new Promise((resolve) => {
      exec('ps aux', (err, stdout) => {
        if (err) {
          resolve([]);
          return;
        }
        const lines = parsePsAux(stdout);
        if (lines.length === 0) {
          resolve([]);
          return;
        }
        resolve(
          lines.map((line) => {
            const matchedCommand = ARTISAN_COMMANDS.find((cmd) => line.command.includes(cmd));
            return {
              id: `artisan-${line.pid}`,
              name: `php artisan ${matchedCommand ?? line.command}`,
              type: 'artisan',
              status: 'up',
              pid: line.pid,
              adapterSource: 'artisan-process',
            };
          }),
        );
      });
    });
  }

  streamLog(_target: StreamTarget, _onLine: (line: LogLine) => void): Promise<Unsubscribe> {
    // v1: no reliable way to attach to stdout of an existing process without ptrace/dtrace.
    // Log a warning and return a no-op unsubscribe.
    console.warn('[ArtisanProcessAdapter] streamLog: log streaming not available for running processes in v1');
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
