import type { DotenvAdapter } from '@varys/adapter-dotenv';
import type { LogFileAdapter } from '@varys/adapter-log-file';
import { IPC_CHANNELS } from '@varys/core';
import type { LogLine, ProjectContext, Unsubscribe } from '@varys/core';
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
}

// Map from subscribe key → unsubscribe function
const activeStreams = new Map<string, Unsubscribe>();

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

  // project:setActivePath
  ipcMain.handle(IPC_CHANNELS.PROJECT_SET_ACTIVE_PATH, async (_e, arg: { path: string }) => {
    configStore.setActivePath(arg.path);
    appCtx.activePath = arg.path;
    newSession();

    // Rebuild dotenv adapter for the new path and re-probe
    if (appCtx.dotenvAdapter !== null) {
      try {
        appCtx.ctx = await appCtx.dotenvAdapter.buildContext(arg.path);
      } catch {
        appCtx.ctx = null;
      }
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

  // events:broadcast
  ipcMain.handle(IPC_CHANNELS.EVENTS_BROADCAST, async () => {
    const reverbAdapter = registry.getById('reverb-redis');
    if (!reverbAdapter) return [];
    return reverbAdapter.listBroadcasts();
  });

  // events:resetStream
  ipcMain.handle(IPC_CHANNELS.EVENTS_RESET_STREAM, async () => {
    const reverbAdapter = registry.getById('reverb-redis');
    if (reverbAdapter) {
      await reverbAdapter.resetBroadcastStream();
    }
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
        const adapters = registry.getAll();
        for (const adapter of adapters) {
          try {
            const onLine = (line: LogLine) =>
              pushToRenderer(IPC_CHANNELS.STREAM_PROCESS_LOG, line);
            unsub = await adapter.streamLog({ type: 'processLog', processId }, onLine);
            break;
          } catch {
            // try next adapter
          }
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
