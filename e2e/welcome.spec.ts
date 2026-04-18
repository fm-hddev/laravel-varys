import { test, expect } from '@playwright/test';

import { launchApp, MOCK_PROJECT_PATH } from './helpers/electron';

test.describe('Welcome flow', () => {
  test.skip(
    !process.env['VARYS_E2E'],
    'E2E tests require built Electron app — set VARYS_E2E=true and run npm run make first',
  );

  test('shows Welcome screen on first launch', async () => {
    const { app, page } = await launchApp();
    try {
      await expect(page.getByRole('heading', { name: /varys/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /sélectionner/i })).toBeVisible();
    } finally {
      await app.close();
    }
  });

  test('navigates to processes after selecting a project', async () => {
    const { app, page } = await launchApp();
    try {
      // Simulate project selection by invoking IPC directly
      await app.evaluate(({ ipcMain: _ipcMain }, projectPath) => {
        // Trigger setActivePath via the electron app
        process.env['VARYS_TEST_PROJECT'] = projectPath;
      }, MOCK_PROJECT_PATH);

      // Click "Sélectionner un projet" and mock the dialog
      await page.evaluate((projectPath) => {
        // @ts-expect-error window.varys is exposed via contextBridge
        window.varys.invoke('project:setActivePath', { path: projectPath })
          .catch(() => null);
      }, MOCK_PROJECT_PATH);

      await page.waitForTimeout(500);
      await page.evaluate(() => {
        // @ts-expect-error
        window.varys.invoke('project:health').catch(() => null);
      });

      // Should show health report
      await expect(page.getByText(/continue/i)).toBeVisible({ timeout: 5000 });
    } finally {
      await app.close();
    }
  });
});
