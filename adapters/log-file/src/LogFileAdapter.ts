import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

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
import { watch as chokidarWatch } from 'chokidar';

import { parseLogLine } from './parseLogLine.js';

const TAIL_LINES = 200;

/**
 * Reads the last N lines of a file without loading the entire file.
 * Uses a simple reverse-scan approach via readline for simplicity.
 */
async function readLastLines(filePath: string, maxLines: number): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const lines: string[] = [];
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath, { encoding: 'utf8' }),
      crlfDelay: Infinity,
    });
    rl.on('line', (line) => {
      lines.push(line);
      if (lines.length > maxLines) {
        lines.shift();
      }
    });
    rl.on('close', () => resolve(lines));
    rl.on('error', reject);
  });
}

/**
 * Reads new lines from a file starting at a given byte offset.
 */
async function readLinesFromOffset(
  filePath: string,
  offset: number,
): Promise<{ lines: string[]; newOffset: number }> {
  return new Promise((resolve, reject) => {
    const lines: string[] = [];
    const stream = fs.createReadStream(filePath, { encoding: 'utf8', start: offset });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
    rl.on('line', (line) => lines.push(line));
    rl.on('close', () => {
      const stat = fs.statSync(filePath);
      resolve({ lines, newOffset: stat.size });
    });
    rl.on('error', reject);
  });
}

/**
 * Adapter that watches Laravel log files and streams new log lines in real-time.
 * Uses chokidar for file system watching.
 */
export class LogFileAdapter implements DataSourceAdapter {
  readonly id = 'log-file';
  readonly name = 'LogFileAdapter';

  private readonly projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  private get logsDir(): string {
    return path.join(this.projectPath, 'storage', 'logs');
  }

  probe(): Promise<ProbeResult> {
    try {
      fs.accessSync(this.logsDir, fs.constants.R_OK);
      return Promise.resolve({ available: true });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      return Promise.resolve({ available: false, reason });
    }
  }

  listLogFiles(): Promise<string[]> {
    try {
      const entries = fs.readdirSync(this.logsDir);
      return Promise.resolve(entries.filter((f) => f.endsWith('.log')));
    } catch (err) {
      return Promise.reject(err);
    }
  }

  async streamAppLogs(filename: string, onLine: (line: LogLine) => void): Promise<Unsubscribe> {
    const filePath = path.join(this.logsDir, filename);

    // Read existing lines (tail 200)
    let currentOffset = 0;
    try {
      const lines = await readLastLines(filePath, TAIL_LINES);
      for (const raw of lines) {
        const parsed = parseLogLine(raw);
        if (parsed) onLine(parsed);
      }
      currentOffset = fs.statSync(filePath).size;
    } catch {
      // File may not exist yet — watcher will handle creation
    }

    // Watch for changes
    const watcher = chokidarWatch(filePath, {
      persistent: true,
      usePolling: false,
      ignoreInitial: true,
    });

    watcher.on('change', () => {
      readLinesFromOffset(filePath, currentOffset)
        .then(({ lines, newOffset }) => {
          currentOffset = newOffset;
          for (const raw of lines) {
            const parsed = parseLogLine(raw);
            if (parsed) onLine(parsed);
          }
        })
        .catch(() => undefined);
    });

    return () => {
      void watcher.close();
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
