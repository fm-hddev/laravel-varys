import { describe, expect, it } from 'vitest';

import type {
  Broadcast,
  FailedJob,
  HealthReport,
  KnownPath,
  LogLine,
  Process,
  ProbeResult,
  QueueStats,
} from '../types/domain.js';
import type { ProjectContext } from '../types/context.js';
import type { DataSourceAdapter, StreamTarget } from '../types/adapter.js';

// Type-guard helpers (runtime checks that double as compile-time proofs)

function isProbeResultAvailable(r: ProbeResult): r is { available: true } {
  return r.available === true;
}

function isProbeResultUnavailable(r: ProbeResult): r is { available: false; reason: string } {
  return r.available === false;
}

describe('ProbeResult discriminated union', () => {
  it('narrows to available branch', () => {
    const r: ProbeResult = { available: true };
    expect(isProbeResultAvailable(r)).toBe(true);
    expect(isProbeResultUnavailable(r)).toBe(false);
  });

  it('narrows to unavailable branch', () => {
    const r: ProbeResult = { available: false, reason: 'Docker not running' };
    expect(isProbeResultUnavailable(r)).toBe(true);
    if (isProbeResultUnavailable(r)) {
      expect(r.reason).toBe('Docker not running');
    }
  });
});

describe('Process type', () => {
  it('accepts valid process shapes', () => {
    const p: Process = {
      id: 'proc-1',
      name: 'laravel-app',
      type: 'docker',
      status: 'up',
      containerId: 'abc123',
      adapterSource: 'docker',
    };
    expect(p.type).toBe('docker');
    expect(p.status).toBe('up');
  });

  it('accepts unknown type', () => {
    const p: Process = {
      id: 'proc-2',
      name: 'mystery',
      type: 'unknown',
      status: 'down',
      adapterSource: 'manual',
    };
    expect(p.type).toBe('unknown');
  });
});

describe('LogLine type', () => {
  it('accepts line with optional level', () => {
    const line: LogLine = {
      timestamp: new Date('2026-04-17T00:00:00Z'),
      content: '[ERROR] Something broke',
      level: 'ERROR',
    };
    expect(line.level).toBe('ERROR');
  });

  it('accepts line without level', () => {
    const line: LogLine = {
      timestamp: new Date(),
      content: 'raw output',
    };
    expect(line.level).toBeUndefined();
  });
});

describe('Broadcast type', () => {
  it('accepts valid broadcast', () => {
    const b: Broadcast = {
      id: 'evt-1',
      channel: 'private-orders.1',
      event: 'OrderShipped',
      payload: { orderId: 42 },
      receivedAt: new Date(),
    };
    expect(b.channel).toBe('private-orders.1');
  });
});

describe('QueueStats type', () => {
  it('accepts database driver stats', () => {
    const stats: QueueStats = {
      driver: 'database',
      queues: [{ name: 'default', pending: 5, processing: 1, failed: 0 }],
    };
    expect(stats.driver).toBe('database');
    expect(stats.queues).toHaveLength(1);
  });
});

describe('FailedJob type', () => {
  it('accepts numeric id', () => {
    const job: FailedJob = {
      id: 42,
      queue: 'default',
      payload: { command: 'App\\Jobs\\SendEmail' },
      exception: 'RuntimeException: Connection refused',
      failedAt: new Date(),
    };
    expect(typeof job.id).toBe('number');
  });

  it('accepts string id', () => {
    const job: FailedJob = {
      id: 'uuid-abc-123',
      queue: 'emails',
      payload: {},
      exception: 'TimeoutException',
      failedAt: new Date(),
    };
    expect(typeof job.id).toBe('string');
  });
});

describe('HealthReport type', () => {
  it('accepts mixed probe results', () => {
    const report: HealthReport = {
      adapters: [
        { id: 'docker', name: 'Docker', result: { available: true } },
        { id: 'redis', name: 'Redis', result: { available: false, reason: 'Connection refused' } },
      ],
      probedAt: new Date(),
    };
    expect(report.adapters).toHaveLength(2);
  });
});

describe('KnownPath type', () => {
  it('accepts valid known path', () => {
    const path: KnownPath = {
      label: 'My Laravel App',
      projectPath: '/home/user/my-app',
      lastUsedAt: new Date(),
    };
    expect(path.projectPath).toBe('/home/user/my-app');
  });
});

describe('ProjectContext type', () => {
  it('accepts full context', () => {
    const ctx: ProjectContext = {
      projectPath: '/home/user/app',
      env: { APP_ENV: 'local' },
      composeProjectName: 'myapp',
      dbConnection: 'mysql',
      reverbScalingEnabled: false,
      redisHost: '127.0.0.1',
      redisPort: 6379,
    };
    expect(ctx.dbConnection).toBe('mysql');
  });

  it('accepts minimal context (optional fields absent)', () => {
    const ctx: ProjectContext = {
      projectPath: '/home/user/app',
      env: {},
      reverbScalingEnabled: false,
      redisHost: '127.0.0.1',
      redisPort: 6379,
    };
    expect(ctx.composeProjectName).toBeUndefined();
    expect(ctx.dbConnection).toBeUndefined();
  });
});

describe('StreamTarget discriminated union', () => {
  it('narrows processLog branch', () => {
    const t: StreamTarget = { type: 'processLog', processId: 'proc-1' };
    if (t.type === 'processLog') {
      expect(t.processId).toBe('proc-1');
    }
  });

  it('narrows appLog branch', () => {
    const t: StreamTarget = { type: 'appLog', file: '/storage/logs/laravel.log' };
    if (t.type === 'appLog') {
      expect(t.file).toBe('/storage/logs/laravel.log');
    }
  });
});

describe('DataSourceAdapter interface shape', () => {
  it('can be satisfied by a minimal mock object', () => {
    // Compile-time check: this object must satisfy DataSourceAdapter
    const adapter: DataSourceAdapter = {
      id: 'mock',
      name: 'Mock Adapter',
      probe: async () => ({ available: true }),
      listProcesses: async () => [],
      streamLog: async (_target, _onLine) => () => undefined,
      listBroadcasts: async () => [],
      resetBroadcastStream: async () => undefined,
      getQueueStats: async () => ({ driver: 'redis', queues: [] }),
      listFailedJobs: async () => [],
    };

    expect(adapter.id).toBe('mock');
  });
});
