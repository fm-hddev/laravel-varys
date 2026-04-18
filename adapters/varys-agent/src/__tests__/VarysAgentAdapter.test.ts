import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { VarysAgentAdapter } from '../VarysAgentAdapter.js';

describe('VarysAgentAdapter', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('probe()', () => {
    it('returns available:true when /_varys/ping responds { varys: true }', async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ varys: true }),
      } as Response);

      const adapter = new VarysAgentAdapter({ baseUrl: 'http://localhost:8000' });
      const result = await adapter.probe();

      expect(result.available).toBe(true);
      const [calledUrl] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, ...unknown[]];
      expect(calledUrl).toBe('http://localhost:8000/_varys/ping');
    });

    it('returns available:false when response JSON does not contain { varys: true }', async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'ok' }),
      } as Response);

      const adapter = new VarysAgentAdapter({ baseUrl: 'http://localhost:8000' });
      const result = await adapter.probe();

      expect(result.available).toBe(false);
    });

    it('returns available:false when fetch throws (network error)', async () => {
      globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const adapter = new VarysAgentAdapter({ baseUrl: 'http://localhost:8000' });
      const result = await adapter.probe();

      expect(result.available).toBe(false);
    });

    it('returns available:false on timeout (AbortError)', async () => {
      globalThis.fetch = vi.fn().mockRejectedValueOnce(
        Object.assign(new Error('The operation was aborted'), { name: 'AbortError' }),
      );

      const adapter = new VarysAgentAdapter({ baseUrl: 'http://localhost:8000' });
      const result = await adapter.probe();

      expect(result.available).toBe(false);
    });

    it('returns available:false when ok is false', async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({}),
      } as Response);

      const adapter = new VarysAgentAdapter({ baseUrl: 'http://localhost:8000' });
      const result = await adapter.probe();

      expect(result.available).toBe(false);
    });
  });

  describe('retryFailedJob()', () => {
    it('POSTs to /_varys/jobs/:id/retry on success', async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      const adapter = new VarysAgentAdapter({ baseUrl: 'http://localhost:8000' });
      await expect(adapter.retryFailedJob('job-uuid-123')).resolves.toBeUndefined();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/_varys/jobs/job-uuid-123/retry',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('throws when server returns 404', async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Not found' }),
      } as Response);

      const adapter = new VarysAgentAdapter({ baseUrl: 'http://localhost:8000' });
      await expect(adapter.retryFailedJob('unknown-id')).rejects.toThrow();
    });
  });

  describe('getRoutesSnapshot()', () => {
    it('GETs /_varys/routes and returns the JSON response', async () => {
      const routes = [{ uri: '/api/users', methods: ['GET'] }];
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(routes),
      } as Response);

      const adapter = new VarysAgentAdapter({ baseUrl: 'http://localhost:8000' });
      const result = await adapter.getRoutesSnapshot();

      expect(result).toEqual(routes);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/_varys/routes',
        expect.any(Object),
      );
    });
  });

  describe('getSchedulerSnapshot()', () => {
    it('GETs /_varys/scheduler and returns the JSON response', async () => {
      const scheduler = { tasks: ['SendEmails'] };
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(scheduler),
      } as Response);

      const adapter = new VarysAgentAdapter({ baseUrl: 'http://localhost:8000' });
      const result = await adapter.getSchedulerSnapshot();

      expect(result).toEqual(scheduler);
    });
  });
});
