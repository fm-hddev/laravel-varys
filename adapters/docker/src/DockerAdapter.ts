import { exec, spawn } from 'node:child_process';

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

import { parseDockerNdjson } from './parseDockerNdjson.js';

export interface DockerAdapterOptions {
  /** The COMPOSE_PROJECT_NAME used to filter containers */
  composeProjectName: string;
}

function mapStatus(state: string, status: string): Process['status'] {
  if (state === 'exited' || state === 'dead' || state === 'created') return 'down';
  if (status.toLowerCase().includes('unhealthy')) return 'unhealthy';
  return 'up';
}

/**
 * Adapter that detects processes via `docker ps --format json` (NDJSON).
 * Filters containers by COMPOSE_PROJECT_NAME label.
 * Streams container logs via `docker logs --follow`.
 */
export class DockerAdapter implements DataSourceAdapter {
  readonly id = 'docker';
  readonly name = 'DockerAdapter';

  constructor(private readonly options: DockerAdapterOptions) {}

  probe(): Promise<ProbeResult> {
    return new Promise((resolve) => {
      exec('docker info', (err) => {
        if (err) {
          resolve({ available: false, reason: err.message });
        } else {
          resolve({ available: true });
        }
      });
    });
  }

  listProcesses(): Promise<Process[]> {
    return new Promise((resolve) => {
      exec('docker ps --format json --all', (err, stdout) => {
        if (err) {
          resolve([]);
          return;
        }
        try {
          const containers = parseDockerNdjson(stdout);
          const filtered = containers.filter((c) =>
            c.Labels.includes(`com.docker.compose.project=${this.options.composeProjectName}`),
          );
          resolve(
            filtered.map((c) => ({
              id: c.ID,
              name: c.Names,
              type: 'docker',
              status: mapStatus(c.State, c.Status),
              containerId: c.ID,
              adapterSource: 'docker',
            })),
          );
        } catch {
          resolve([]);
        }
      });
    });
  }

  streamLog(target: StreamTarget, onLine: (line: LogLine) => void): Promise<Unsubscribe> {
    if (target.type !== 'processLog') {
      return Promise.resolve(() => undefined);
    }

    const child = spawn('docker', [
      'logs',
      '--follow',
      '--tail',
      '100',
      target.processId,
    ]);

    const parseLine = (data: Buffer) => {
      const lines = data.toString().split('\n').filter(Boolean);
      for (const content of lines) {
        onLine({ timestamp: new Date(), content });
      }
    };

    child.stdout.on('data', parseLine);
    child.stderr.on('data', parseLine);

    return Promise.resolve(() => {
      child.kill();
    });
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
