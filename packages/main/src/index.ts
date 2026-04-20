import path from 'node:path';

import { ArtisanProcessAdapter } from '@varys/adapter-artisan-process';
import { DockerAdapter } from '@varys/adapter-docker';
import { DotenvAdapter } from '@varys/adapter-dotenv';
import { LaravelQueueAdapter } from '@varys/adapter-laravel-queue';
import { LogFileAdapter } from '@varys/adapter-log-file';
import { ReverbRedisAdapter } from '@varys/adapter-reverb-redis';
import { ViteProcessAdapter } from '@varys/adapter-vite-process';
import type { ProjectContext } from '@varys/core';
import { IPC_CHANNELS } from '@varys/core';
import { app, ipcMain, shell } from 'electron';

import { AdapterRegistry } from './adapters/AdapterRegistry';
import { ConfigStore } from './config/ConfigStore';
import type { AppContext } from './ipc/handlers';
import { applyOverrides, setupIpcHandlers } from './ipc/handlers';
import { pushToRenderer } from './ipc/streamBridge';
import { checkForUpdate } from './services/update-checker';
import { createWindow } from './window';

const t0 = performance.now();

function buildQueueAdapter(ctx: ProjectContext): LaravelQueueAdapter | null {
  const { env } = ctx;

  if (ctx.dbConnection === 'sqlite') {
    const filename = env['DB_DATABASE'] ?? path.join(ctx.projectPath, 'database/database.sqlite');
    return new LaravelQueueAdapter({ driver: 'sqlite', sqlite: { filename } });
  }

  if (ctx.dbConnection === 'mysql') {
    return new LaravelQueueAdapter({
      driver: 'mysql',
      mysql: {
        host: env['DB_HOST'] ?? '127.0.0.1',
        port: parseInt(env['DB_PORT'] ?? '3306', 10),
        database: env['DB_DATABASE'] ?? '',
        user: env['DB_USERNAME'] ?? '',
        password: env['DB_PASSWORD'] ?? '',
      },
    });
  }

  if (ctx.dbConnection === 'pgsql') {
    return new LaravelQueueAdapter({
      driver: 'pgsql',
      pgsql: {
        host: env['DB_HOST'] ?? '127.0.0.1',
        port: parseInt(env['DB_PORT'] ?? '5432', 10),
        database: env['DB_DATABASE'] ?? '',
        user: env['DB_USERNAME'] ?? '',
        password: env['DB_PASSWORD'] ?? '',
      },
    });
  }

  if (env['QUEUE_CONNECTION'] === 'redis') {
    return new LaravelQueueAdapter({
      driver: 'redis',
      redis: {
        host: ctx.redisHost,
        port: ctx.redisPort,
        password: env['REDIS_PASSWORD'],
        queues: (env['QUEUE_REDIS_QUEUE'] ?? 'default').split(','),
      },
    });
  }

  return null;
}

function registerAdaptersFromContext(ctx: ProjectContext, registry: AdapterRegistry): void {
  registry.register(new DockerAdapter({ composeProjectName: ctx.composeProjectName ?? path.basename(ctx.projectPath) }));
  registry.register(new ArtisanProcessAdapter());
  registry.register(new ViteProcessAdapter());
  registry.register(new LogFileAdapter(ctx.projectPath));

  const queueAdapter = buildQueueAdapter(ctx);
  if (queueAdapter) registry.register(queueAdapter);

  if (ctx.reverbScalingEnabled) {
    registry.register(new ReverbRedisAdapter({
      host: ctx.env['REVERB_HOST'] ?? '127.0.0.1',
      port: parseInt(ctx.env['REVERB_PORT'] ?? '8080', 10),
      appId: ctx.env['REVERB_APP_ID'] ?? '',
      appKey: ctx.env['REVERB_APP_KEY'] ?? '',
      appSecret: ctx.env['REVERB_APP_SECRET'] ?? '',
      projectPath: ctx.projectPath,
    }));
  }
}

app.whenReady().then(() => {
  const configStore = new ConfigStore();
  const activePath = configStore.getActivePath();

  const registry = new AdapterRegistry();
  let dotenvAdapter: DotenvAdapter | null = null;

  if (activePath) {
    dotenvAdapter = new DotenvAdapter(path.join(activePath, '.env'));
    registry.register(dotenvAdapter);
  }

  const appCtx: AppContext = {
    configStore,
    registry,
    dotenvAdapter,
    activePath,
    ctx: null,
    rebuildAdapters: (ctx) => registerAdaptersFromContext(ctx, registry),
  };

  if (activePath && dotenvAdapter) {
    dotenvAdapter
      .buildContext(activePath)
      .then((ctx) => {
        const overrides = configStore.getProjectOverrides(activePath);
        appCtx.ctx = applyOverrides(ctx, overrides);
        appCtx.rebuildAdapters(appCtx.ctx);
      })
      .catch(() => {
        appCtx.ctx = null;
      });
  }

  setupIpcHandlers(appCtx);

  ipcMain.handle(IPC_CHANNELS.UPDATER_OPEN_RELEASE, (_e, arg: { url: string }) => {
    void shell.openExternal(arg.url);
  });

  const win = createWindow();

  win.once('ready-to-show', () => {
    win.show();
    const startupMs = Math.round(performance.now() - t0);
    console.log(`[varys] startup_ms=${startupMs}`);

    void checkForUpdate(app.getVersion()).then((info) => {
      if (info.available) {
        pushToRenderer(IPC_CHANNELS.UPDATER_UPDATE_AVAILABLE, info);
      }
    });
  });
}).catch((err) => {
  console.error('[varys] Failed to start', err);
  process.exit(1);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
