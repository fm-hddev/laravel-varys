import path from 'node:path';

import { _electron as electron } from 'playwright';
import type { ElectronApplication, Page } from 'playwright';

const MOCK_PROJECT_PATH = path.resolve(
  __dirname,
  '../fixtures/laravel-project-mock',
);

export async function launchApp(): Promise<{ app: ElectronApplication; page: Page }> {
  const app = await electron.launch({
    args: [path.resolve(__dirname, '../../packages/main/.vite/build/index.js')],
    env: {
      ...process.env,
      VARYS_E2E: 'true',
      NODE_ENV: 'test',
      // Point renderer to built output
      ELECTRON_RENDERER_URL: undefined,
    },
  });

  const page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');
  return { app, page };
}

export { MOCK_PROJECT_PATH };
