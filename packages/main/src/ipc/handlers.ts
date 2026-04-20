import path from 'node:path';

import { DotenvAdapter } from '@varys/adapter-dotenv';
import type { LaravelQueueAdapter } from '@varys/adapter-laravel-queue';
import type { LogFileAdapter } from '@varys/adapter-log-file';
import type { ReverbRedisAdapter } from '@varys/adapter-reverb-redis';
import { IPC_CHANNELS } from '@varys/core';
import type { Broadcast, LogLine, ProjectContext, ProjectOverrides, Unsubscribe } from '@varys/core';
import { dialog, ipcMain } from 'electron';

import type { AdapterRegistry } from '../adapters/AdapterRegistry';
import { newSession } from '../adapters/SessionManager';
import type { ConfigStore } from '../config/ConfigStore';

import { pushToRenderer } from './streamBridge';

export interface AppContext {
  configStore: ConfigStore;
  registry: AdapterRegistry;
  dotenvAdapter: DotenvAdapter | null;
  activePath: string | null;
  ctx: ProjectContext | null;
  /** Re-registers all context-dependent adapters after a project switch. */
  rebuildAdapters: (ctx: ProjectContext) => void;
}

/** Merge stored overrides into a ProjectContext, updating both env dict and parsed fields. */
export function applyOverrides(ctx: ProjectContext, overrides: ProjectOverrides): ProjectContext {
  const env = { ...ctx.env };
  if (overrides.dbHost !== undefined) env['DB_HOST'] = overrides.dbHost;
  if (overrides.dbPort !== undefined) env['DB_PORT'] = String(overrides.dbPort);
  if (overrides.redisHost !== undefined) env['REDIS_HOST'] = overrides.redisHost;
  if (overrides.redisPort !== undefined) env['REDIS_PORT'] = String(overrides.redisPort);
  if (overrides.reverbHost !== undefined) env['REVERB_HOST'] = overrides.reverbHost;
  if (overrides.reverbPort !== undefined) env['REVERB_PORT'] = String(overrides.reverbPort);
  if (overrides.appUrl !== undefined) env['APP_URL'] = overrides.appUrl;
  return {
    ...ctx,
    env,
    redisHost: overrides.redisHost ?? ctx.redisHost,
    redisPort: overrides.redisPort ?? ctx.redisPort,
  };
}

// Map from subscribe key → unsubscribe function
const activeStreams = new Map<string, Unsubscribe>();

// Reverb broadcast buffer (sliding window, max 500 entries)
const broadcastBuffer: Broadcast[] = [];
let reverbUnsub: Unsubscribe | null = null;

async function startReverbStream(registry: AdapterRegistry): Promise<void> {
  if (reverbUnsub) {
    await reverbUnsub();
    reverbUnsub = null;
  }
  const adapter = registry.getById('reverb-redis') as ReverbRedisAdapter | undefined;
  if (!adapter) return;
  try {
    reverbUnsub = await adapter.streamBroadcasts((broadcast) => {
      broadcastBuffer.push(broadcast);
      if (broadcastBuffer.length > 500) broadcastBuffer.shift();
    });
  } catch {
    // WebSocket connection failed — broadcasts unavailable until next project reload
  }
}

function streamKey(req: { type: string; processId?: string; file?: string }): string {
  if (req.type === 'processLog' && 'processId' in req) {
    return `processLog:${req.processId ?? ''}`;
  }
  if (req.type === 'appLog' && 'file' in req) {
    return `appLog:${req.file ?? ''}`;
  }
  return req.type;
}

export function setupIpcHandlers(appCtx: AppContext): void {
  const { configStore, registry } = appCtx;

  // Wrap rebuildAdapters so the Reverb stream restarts whenever adapters change
  const originalRebuild = appCtx.rebuildAdapters;
  appCtx.rebuildAdapters = (ctx) => {
    originalRebuild(ctx);
    void startReverbStream(registry);
  };

  // project:setActivePath
  ipcMain.handle(IPC_CHANNELS.PROJECT_SET_ACTIVE_PATH, async (_e, arg: { path: string }) => {
    configStore.setActivePath(arg.path);
    appCtx.activePath = arg.path;
    newSession();

    // Always create a new DotenvAdapter for the new project path so the
    // correct .env is read (not the previous project's file).
    const dotenv = new DotenvAdapter(path.join(arg.path, '.env'));
    registry.register(dotenv);
    appCtx.dotenvAdapter = dotenv;

    try {
      const ctx = await appCtx.dotenvAdapter.buildContext(arg.path);
      const overrides = configStore.getProjectOverrides(arg.path);
      appCtx.ctx = applyOverrides(ctx, overrides);
      appCtx.rebuildAdapters(appCtx.ctx);
    } catch {
      appCtx.ctx = null;
    }
  });

  // project:getActivePath
  ipcMain.handle(IPC_CHANNELS.PROJECT_GET_ACTIVE_PATH, () => {
    return configStore.getActivePath();
  });

  // project:listKnownPaths
  ipcMain.handle(IPC_CHANNELS.PROJECT_LIST_KNOWN_PATHS, () => {
    return configStore.get().knownPaths;
  });

  // project:removeKnownPath
  ipcMain.handle(IPC_CHANNELS.PROJECT_REMOVE_KNOWN_PATH, (_e, arg: { path: string }) => {
    configStore.removeKnownPath(arg.path);
  });

  // project:health
  ipcMain.handle(IPC_CHANNELS.PROJECT_HEALTH, async () => {
    return registry.probeAll(appCtx.ctx ?? { projectPath: '', env: {}, reverbScalingEnabled: false, redisHost: '127.0.0.1', redisPort: 6379 });
  });

  // project:openDialog
  ipcMain.handle(IPC_CHANNELS.PROJECT_OPEN_DIALOG, async (_e) => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0] ?? null;
  });

  // project:getOverrides
  ipcMain.handle(IPC_CHANNELS.PROJECT_GET_OVERRIDES, () => {
    const projectPath = appCtx.activePath;
    const overrides = projectPath ? configStore.getProjectOverrides(projectPath) : {};
    const env = appCtx.ctx?.env ?? {};
    return {
      overrides,
      envDefaults: {
        dbHost: env['DB_HOST'] ?? '127.0.0.1',
        dbPort: parseInt(env['DB_PORT'] ?? '3306', 10),
        redisHost: env['REDIS_HOST'] ?? '127.0.0.1',
        redisPort: parseInt(env['REDIS_PORT'] ?? '6379', 10),
        reverbHost: env['REVERB_HOST'] ?? '127.0.0.1',
        reverbPort: parseInt(env['REVERB_PORT'] ?? '8080', 10),
        appUrl: env['APP_URL'] ?? '',
      },
    };
  });

  // project:setOverrides
  ipcMain.handle(
    IPC_CHANNELS.PROJECT_SET_OVERRIDES,
    async (_e, arg: { overrides: ProjectOverrides }) => {
      const projectPath = appCtx.activePath;
      if (!projectPath) return;
      configStore.setProjectOverrides(projectPath, arg.overrides);
      // Rebuild adapters with updated overrides
      if (appCtx.dotenvAdapter) {
        try {
          const ctx = await appCtx.dotenvAdapter.buildContext(projectPath);
          appCtx.ctx = applyOverrides(ctx, arg.overrides);
          appCtx.rebuildAdapters(appCtx.ctx);
        } catch {
          // keep existing context
        }
      }
    },
  );

  // project:updateAdapterConfig
  ipcMain.handle(
    IPC_CHANNELS.PROJECT_UPDATE_ADAPTER_CONFIG,
    (_e, arg: { adapterId: string; enabled: boolean }) => {
      configStore.updateAdapterEnabled(arg.adapterId, arg.enabled);
    },
  );

  // processes:list
  ipcMain.handle(IPC_CHANNELS.PROCESSES_LIST, async () => {
    const adapters = registry.getAll();
    const results = await Promise.allSettled(adapters.map((a) => a.listProcesses()));
    return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
  });

  // events:broadcast — returns buffered broadcasts accumulated from the Redis subscription
  ipcMain.handle(IPC_CHANNELS.EVENTS_BROADCAST, () => [...broadcastBuffer]);

  // events:resetStream — clears the broadcast buffer
  ipcMain.handle(IPC_CHANNELS.EVENTS_RESET_STREAM, () => {
    broadcastBuffer.length = 0;
  });

  // queues:stats
  ipcMain.handle(IPC_CHANNELS.QUEUES_STATS, async () => {
    const queueAdapter = registry.getById('laravel-queue');
    if (!queueAdapter) return { driver: 'database', queues: [] };
    return queueAdapter.getQueueStats();
  });

  // queues:failed
  ipcMain.handle(IPC_CHANNELS.QUEUES_FAILED, async () => {
    const queueAdapter = registry.getById('laravel-queue');
    if (!queueAdapter) return [];
    return queueAdapter.listFailedJobs();
  });

  // queues:retryJob
  ipcMain.handle(IPC_CHANNELS.QUEUES_RETRY_JOB, async (_e, arg: { id: string | number }) => {
    const queueAdapter = registry.getById('laravel-queue') as LaravelQueueAdapter | undefined;
    if (!queueAdapter) return;
    await queueAdapter.retryFailedJob(arg.id);
  });

  // queues:forgetJob
  ipcMain.handle(IPC_CHANNELS.QUEUES_FORGET_JOB, async (_e, arg: { id: string | number }) => {
    const queueAdapter = registry.getById('laravel-queue') as LaravelQueueAdapter | undefined;
    if (!queueAdapter) return;
    await queueAdapter.forgetFailedJob(arg.id);
  });

  // queues:purgeAll
  ipcMain.handle(IPC_CHANNELS.QUEUES_PURGE_ALL, async () => {
    const queueAdapter = registry.getById('laravel-queue') as LaravelQueueAdapter | undefined;
    if (!queueAdapter) return;
    await queueAdapter.purgeAllFailedJobs();
  });

  // logs:listFiles
  ipcMain.handle(IPC_CHANNELS.LOGS_LIST_FILES, async () => {
    const logAdapter = registry.getById('log-file') as LogFileAdapter | undefined;
    if (!logAdapter) return [];
    try {
      return await logAdapter.listLogFiles();
    } catch {
      return [];
    }
  });

  // stream:subscribe
  ipcMain.handle(
    IPC_CHANNELS.STREAM_SUBSCRIBE,
    async (
      _e,
      arg: { type: 'processLog'; processId: string } | { type: 'appLog'; file: string },
    ) => {
      const key = streamKey(arg);
      if (activeStreams.has(key)) return;

      let unsub: Unsubscribe | null = null;

      if (arg.type === 'processLog') {
        const processId = (arg as { type: 'processLog'; processId: string }).processId;
        const dockerAdapter = registry.getById('docker');
        if (dockerAdapter) {
          const onLine = (line: LogLine) => pushToRenderer(IPC_CHANNELS.STREAM_PROCESS_LOG, line);
          unsub = await dockerAdapter.streamLog({ type: 'processLog', processId }, onLine);
        }
      } else if (arg.type === 'appLog') {
        const file = (arg as { type: 'appLog'; file: string }).file;
        const logAdapter = registry.getById('log-file') as LogFileAdapter | undefined;
        if (logAdapter) {
          const onLine = (line: LogLine) => pushToRenderer(IPC_CHANNELS.STREAM_APP_LOG, line);
          unsub = await logAdapter.streamAppLogs(file, onLine);
        }
      }

      if (unsub) {
        activeStreams.set(key, unsub);
      }
    },
  );

  // stream:unsubscribe
  ipcMain.handle(
    IPC_CHANNELS.STREAM_UNSUBSCRIBE,
    async (
      _e,
      arg: { type: 'processLog'; processId: string } | { type: 'appLog'; file: string },
    ) => {
      const key = streamKey(arg);
      const unsub = activeStreams.get(key);
      if (unsub) {
        await unsub();
        activeStreams.delete(key);
      }
    },
  );
}
