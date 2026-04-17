import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { DotenvAdapter } from '../DotenvAdapter.js';

const FIXTURES = path.join(import.meta.dirname, '../../fixtures');

describe('DotenvAdapter', () => {
  describe('probe()', () => {
    it('returns available: true when .env is present and parseable', async () => {
      const adapter = new DotenvAdapter(path.join(FIXTURES, 'valid.env'));
      const result = await adapter.probe();
      expect(result).toEqual({ available: true });
    });

    it('returns available: false with reason when .env is absent', async () => {
      const adapter = new DotenvAdapter(path.join(FIXTURES, 'nonexistent.env'));
      const result = await adapter.probe();
      expect(result.available).toBe(false);
      if (!result.available) {
        expect(result.reason).toMatch(/not found|ENOENT/i);
      }
    });
  });

  describe('buildContext()', () => {
    it('parses valid.env into ProjectContext', async () => {
      const adapter = new DotenvAdapter(path.join(FIXTURES, 'valid.env'));
      const ctx = await adapter.buildContext(FIXTURES);
      expect(ctx.projectPath).toBe(FIXTURES);
      expect(ctx.dbConnection).toBe('mysql');
      expect(ctx.redisHost).toBe('127.0.0.1');
      expect(ctx.redisPort).toBe(6379);
      expect(ctx.reverbScalingEnabled).toBe(true);
      expect(ctx.composeProjectName).toBe('myapp');
    });

    it('defaults reverbScalingEnabled to false when key is absent', async () => {
      const adapter = new DotenvAdapter(path.join(FIXTURES, 'missing-reverb.env'));
      const ctx = await adapter.buildContext(FIXTURES);
      expect(ctx.reverbScalingEnabled).toBe(false);
      expect(ctx.dbConnection).toBe('pgsql');
      expect(ctx.redisPort).toBe(6380);
    });

    it('throws when .env file is not found', async () => {
      const adapter = new DotenvAdapter(path.join(FIXTURES, 'nonexistent.env'));
      await expect(adapter.buildContext(FIXTURES)).rejects.toThrow();
    });
  });

  describe('DataSourceAdapter interface — process/queue methods return empty', () => {
    it('listProcesses() returns []', async () => {
      const adapter = new DotenvAdapter(path.join(FIXTURES, 'valid.env'));
      expect(await adapter.listProcesses()).toEqual([]);
    });

    it('listBroadcasts() returns []', async () => {
      const adapter = new DotenvAdapter(path.join(FIXTURES, 'valid.env'));
      expect(await adapter.listBroadcasts()).toEqual([]);
    });

    it('listFailedJobs() returns []', async () => {
      const adapter = new DotenvAdapter(path.join(FIXTURES, 'valid.env'));
      expect(await adapter.listFailedJobs()).toEqual([]);
    });

    it('getQueueStats() returns empty queues', async () => {
      const adapter = new DotenvAdapter(path.join(FIXTURES, 'valid.env'));
      const stats = await adapter.getQueueStats();
      expect(stats.queues).toEqual([]);
    });

    it('streamLog() returns a no-op unsubscribe', async () => {
      const adapter = new DotenvAdapter(path.join(FIXTURES, 'valid.env'));
      const unsub = await adapter.streamLog({ type: 'appLog', file: '/tmp/app.log' }, () => undefined);
      expect(typeof unsub).toBe('function');
    });
  });
});
