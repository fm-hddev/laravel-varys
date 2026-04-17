import * as childProcess from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it, vi, beforeEach, type Mock } from 'vitest';

import { ViteProcessAdapter } from '../ViteProcessAdapter.js';

vi.mock('node:child_process', () => ({
  exec: vi.fn(),
}));

const LSOF_FIXTURE = fs.readFileSync(
  path.join(import.meta.dirname, '../../fixtures/lsof-port-sample.txt'),
  'utf8',
);

/** Simulates exec returning different output based on command content */
function makeExecRouter(routes: Record<string, { stdout: string; err?: Error }>) {
  return (cmd: string, cb: (err: Error | null, stdout: string, stderr: string) => void) => {
    for (const [pattern, response] of Object.entries(routes)) {
      if (cmd.includes(pattern)) {
        cb(response.err ?? null, response.stdout, '');
        return;
      }
    }
    cb(new Error(`unmocked command: ${cmd}`), '', '');
  };
}

describe('ViteProcessAdapter', () => {
  let adapter: ViteProcessAdapter;

  beforeEach(() => {
    adapter = new ViteProcessAdapter();
    vi.resetAllMocks();
  });

  describe('probe()', () => {
    it('returns available: true when port 5173 is in use', async () => {
      (childProcess.exec as unknown as Mock).mockImplementation(
        makeExecRouter({ 'lsof -i :5173': { stdout: LSOF_FIXTURE } }),
      );
      const result = await adapter.probe();
      expect(result).toEqual({ available: true });
    });

    it('returns available: true when vite process found in ps aux even without port', async () => {
      (childProcess.exec as unknown as Mock).mockImplementation(
        makeExecRouter({
          'lsof -i :5173': { stdout: '', err: new Error('no process') },
          'ps aux': { stdout: 'frederic 99999 0.0 0.1 node vite\n' },
        }),
      );
      const result = await adapter.probe();
      expect(result).toEqual({ available: true });
    });

    it('returns available: false when neither port nor process found', async () => {
      (childProcess.exec as unknown as Mock).mockImplementation(
        makeExecRouter({
          'lsof -i :5173': { stdout: '', err: new Error('no process') },
          'ps aux': { stdout: 'no vite here\n' },
        }),
      );
      const result = await adapter.probe();
      expect(result.available).toBe(false);
    });
  });

  describe('listProcesses()', () => {
    it('returns 1 vite process when port is detected', async () => {
      (childProcess.exec as unknown as Mock).mockImplementation(
        makeExecRouter({
          'lsof -i :5173': { stdout: LSOF_FIXTURE },
          'ps aux': { stdout: 'no vite here\n' },
        }),
      );
      const processes = await adapter.listProcesses();
      expect(processes).toHaveLength(1);
      expect(processes[0]?.type).toBe('vite');
      expect(processes[0]?.status).toBe('up');
      expect(processes[0]?.adapterSource).toBe('vite-process');
    });

    it('returns 1 vite process when ps aux has vite', async () => {
      (childProcess.exec as unknown as Mock).mockImplementation(
        makeExecRouter({
          'lsof -i :5173': { stdout: '', err: new Error('no process') },
          'ps aux': { stdout: 'frederic 54321 0.0 0.2 node vite\n' },
        }),
      );
      const processes = await adapter.listProcesses();
      expect(processes).toHaveLength(1);
    });

    it('deduplicates — returns at most 1 process even if both detections succeed', async () => {
      (childProcess.exec as unknown as Mock).mockImplementation(
        makeExecRouter({
          'lsof -i :5173': { stdout: LSOF_FIXTURE },
          'ps aux': { stdout: 'frederic 54321 0.0 0.2 node vite\n' },
        }),
      );
      const processes = await adapter.listProcesses();
      expect(processes).toHaveLength(1);
    });

    it('returns [] when nothing detected', async () => {
      (childProcess.exec as unknown as Mock).mockImplementation(
        makeExecRouter({
          'lsof -i :5173': { stdout: '', err: new Error('none') },
          'ps aux': { stdout: 'nothing\n' },
        }),
      );
      const processes = await adapter.listProcesses();
      expect(processes).toEqual([]);
    });
  });

  describe('streamLog()', () => {
    it('returns a no-op Unsubscribe', async () => {
      const unsub = await adapter.streamLog(
        { type: 'processLog', processId: '54321' },
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
