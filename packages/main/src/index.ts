import path from 'node:path';

import { DotenvAdapter } from '@varys/adapter-dotenv';
import { app } from 'electron';

import { AdapterRegistry } from './adapters/AdapterRegistry';
import { ConfigStore } from './config/ConfigStore';
import type { AppContext } from './ipc/handlers';
import { setupIpcHandlers } from './ipc/handlers';
import { createWindow } from './window';

const t0 = performance.now();

function buildRegistry(activePath: string | null): {
  registry: AdapterRegistry;
  dotenvAdapter: DotenvAdapter | null;
} {
  const registry = new AdapterRegistry();
  let dotenvAdapter: DotenvAdapter | null = null;

  if (activePath) {
    const envPath = path.join(activePath, '.env');
    dotenvAdapter = new DotenvAdapter(envPath);
    registry.register(dotenvAdapter);
  }

  return { registry, dotenvAdapter };
}

app.whenReady().then(() => {
  const configStore = new ConfigStore();
  const activePath = configStore.getActivePath();

  const { registry, dotenvAdapter } = buildRegistry(activePath);

  const appCtx: AppContext = {
    configStore,
    registry,
    dotenvAdapter,
    activePath,
    ctx: null,
  };

  if (activePath && dotenvAdapter) {
    dotenvAdapter
      .buildContext(activePath)
      .then((ctx) => {
        appCtx.ctx = ctx;
      })
      .catch(() => {
        appCtx.ctx = null;
      });
  }

  setupIpcHandlers(appCtx);

  const win = createWindow();

  win.once('ready-to-show', () => {
    win.show();
    const startupMs = Math.round(performance.now() - t0);
    console.log(`[varys] startup_ms=${startupMs}`);
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
