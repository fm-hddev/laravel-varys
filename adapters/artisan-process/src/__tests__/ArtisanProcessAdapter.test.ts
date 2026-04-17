import * as childProcess from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it, vi, beforeEach, type Mock } from 'vitest';

import { ArtisanProcessAdapter } from '../ArtisanProcessAdapter.js';

vi.mock('node:child_process', () => ({
  exec: vi.fn(),
}));

const PS_FIXTURE = fs.readFileSync(
  path.join(import.meta.dirname, '../../fixtures/ps-aux-sample.txt'),
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

describe('ArtisanProcessAdapter', () => {
  let adapter: ArtisanProcessAdapter;

  beforeEach(() => {
    adapter = new ArtisanProcessAdapter();
    vi.resetAllMocks();
  });

  describe('probe()', () => {
    it('returns available: true when php is found', async () => {
      (childProcess.exec as unknown as Mock).mockImplementation(makeExecSuccess('/usr/bin/php'));
      const result = await adapter.probe();
      expect(result).toEqual({ available: true });
    });

    it('returns available: false when php is not found', async () => {
      (childProcess.exec as unknown as Mock).mockImplementation(makeExecFailure('php not found'));
      const result = await adapter.probe();
      expect(result.available).toBe(false);
    });
  });

  describe('listProcesses()', () => {
    it('returns artisan processes from ps aux output', async () => {
      (childProcess.exec as unknown as Mock).mockImplementation(makeExecSuccess(PS_FIXTURE));
      const processes = await adapter.listProcesses();
      // Fixture has 4 artisan processes (queue:work, schedule:work, reverb:start, serve) + 1 grep line to ignore
      expect(processes.length).toBeGreaterThanOrEqual(4);
      for (const p of processes) {
        expect(p.type).toBe('artisan');
        expect(p.adapterSource).toBe('artisan-process');
      }
    });

    it('includes queue:work process', async () => {
      (childProcess.exec as unknown as Mock).mockImplementation(makeExecSuccess(PS_FIXTURE));
      const processes = await adapter.listProcesses();
      const queueWork = processes.find((p) => p.name.includes('queue:work'));
      expect(queueWork).toBeDefined();
      expect(queueWork?.pid).toBe(12345);
    });

    it('includes schedule:work process', async () => {
      (childProcess.exec as unknown as Mock).mockImplementation(makeExecSuccess(PS_FIXTURE));
      const processes = await adapter.listProcesses();
      const scheduleWork = processes.find((p) => p.name.includes('schedule:work'));
      expect(scheduleWork).toBeDefined();
    });

    it('returns [] when ps aux fails', async () => {
      (childProcess.exec as unknown as Mock).mockImplementation(makeExecFailure('command not found'));
      const processes = await adapter.listProcesses();
      expect(processes).toEqual([]);
    });

    it('returns [] when no artisan processes found', async () => {
      (childProcess.exec as unknown as Mock).mockImplementation(makeExecSuccess('no artisan here\n'));
      const processes = await adapter.listProcesses();
      expect(processes).toEqual([]);
    });
  });

  describe('streamLog()', () => {
    it('returns a no-op Unsubscribe for processLog target', async () => {
      const unsub = await adapter.streamLog(
        { type: 'processLog', processId: '12345' },
        () => undefined,
      );
      expect(typeof unsub).toBe('function');
      void unsub();
    });

    it('returns a no-op Unsubscribe for appLog target', async () => {
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
