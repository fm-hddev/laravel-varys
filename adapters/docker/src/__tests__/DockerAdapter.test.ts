import * as childProcess from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it, vi, beforeEach, type Mock } from 'vitest';

import { DockerAdapter } from '../DockerAdapter.js';

// vi.mock is hoisted by Vitest regardless of source position
vi.mock('node:child_process', () => ({
  exec: vi.fn(),
  spawn: vi.fn(),
}));

const FIXTURE_NDJSON = fs.readFileSync(
  path.join(import.meta.dirname, '../../fixtures/docker-ps-sample.ndjson'),
  'utf8',
);

function makeExecSuccess(stdout: string) {
  return (_cmd: string, cb: (err: Error | null, stdout: string, stderr: string) => void) => {
    cb(null, stdout, '');
  };
}

function makeExecFailure(message: string) {
  return (_cmd: string, cb: (err: Error | null, stdout: string, stderr: string) => void) => {
    cb(new Error(message), '', message);
  };
}

describe('DockerAdapter', () => {
  let adapter: DockerAdapter;

  beforeEach(() => {
    adapter = new DockerAdapter({ composeProjectName: 'myapp' });
    vi.resetAllMocks();
  });

  describe('probe()', () => {
    it('returns available: true when docker info succeeds', async () => {
      (childProcess.exec as unknown as Mock).mockImplementation(makeExecSuccess('Docker info output'));
      const result = await adapter.probe();
      expect(result).toEqual({ available: true });
    });

    it('returns available: false when docker info fails', async () => {
      (childProcess.exec as unknown as Mock).mockImplementation(makeExecFailure('Cannot connect to Docker'));
      const result = await adapter.probe();
      expect(result.available).toBe(false);
      if (!result.available) {
        expect(result.reason).toMatch(/Cannot connect to Docker/);
      }
    });
  });

  describe('listProcesses()', () => {
    it('returns filtered processes matching composeProjectName', async () => {
      (childProcess.exec as unknown as Mock).mockImplementation(makeExecSuccess(FIXTURE_NDJSON));
      const processes = await adapter.listProcesses();
      // Fixture has 3 containers with project=myapp, 1 with otherapp
      expect(processes).toHaveLength(3);
      for (const p of processes) {
        expect(p.type).toBe('docker');
        expect(p.adapterSource).toBe('docker');
      }
    });

    it('maps running state to status: up', async () => {
      (childProcess.exec as unknown as Mock).mockImplementation(makeExecSuccess(FIXTURE_NDJSON));
      const processes = await adapter.listProcesses();
      const running = processes.filter((p) => p.name === 'myapp-mysql-1');
      expect(running[0]?.status).toBe('up');
    });

    it('maps exited state to status: down', async () => {
      (childProcess.exec as unknown as Mock).mockImplementation(makeExecSuccess(FIXTURE_NDJSON));
      const processes = await adapter.listProcesses();
      const exited = processes.filter((p) => p.name === 'myapp-redis-1');
      expect(exited[0]?.status).toBe('down');
    });

    it('maps unhealthy status to status: unhealthy', async () => {
      (childProcess.exec as unknown as Mock).mockImplementation(makeExecSuccess(FIXTURE_NDJSON));
      const processes = await adapter.listProcesses();
      const unhealthy = processes.filter((p) => p.name === 'myapp-reverb-1');
      expect(unhealthy[0]?.status).toBe('unhealthy');
    });

    it('returns [] when docker ps fails', async () => {
      (childProcess.exec as unknown as Mock).mockImplementation(makeExecFailure('docker not found'));
      const processes = await adapter.listProcesses();
      expect(processes).toEqual([]);
    });
  });

  describe('streamLog()', () => {
    it('returns an Unsubscribe function that calls process.kill', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
        kill: vi.fn(),
      };
      (childProcess.spawn as unknown as Mock).mockReturnValue(mockChild);

      const unsub = await adapter.streamLog(
        { type: 'processLog', processId: 'abc123def456' },
        () => undefined,
      );
      expect(typeof unsub).toBe('function');
      void unsub();
      expect(mockChild.kill).toHaveBeenCalled();
    });

    it('returns no-op unsubscribe for non-processLog target', async () => {
      const unsub = await adapter.streamLog(
        { type: 'appLog', file: '/tmp/app.log' },
        () => undefined,
      );
      expect(typeof unsub).toBe('function');
      void unsub();
    });
  });

  describe('DataSourceAdapter — unused methods return empty', () => {
    it('listBroadcasts() returns []', async () => {
      expect(await adapter.listBroadcasts()).toEqual([]);
    });
    it('listFailedJobs() returns []', async () => {
      expect(await adapter.listFailedJobs()).toEqual([]);
    });
    it('getQueueStats() returns empty queues', async () => {
      const stats = await adapter.getQueueStats();
      expect(stats.queues).toEqual([]);
    });
  });
});
