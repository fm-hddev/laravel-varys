import { test, expect } from '@playwright/test';

import { launchApp } from './helpers/electron';

test.describe('LogsView', () => {
  test.skip(
    !process.env['VARYS_E2E'],
    'E2E tests require built Electron app — set VARYS_E2E=true',
  );

  test('renders LogsView with file selector', async () => {
    const { app, page } = await launchApp();
    try {
      await page.evaluate(() => {
        // @ts-expect-error
        window.__reactRouter?.navigate?.('/logs');
      });
      await page.waitForTimeout(500);

      await expect(page.getByRole('heading', { name: /logs/i })).toBeVisible();
      // Either file selector visible or no-logs empty state
      const hasSelector = await page.getByLabel(/fichier de log/i).count() > 0;
      const hasEmpty = await page.getByText(/aucun fichier/i).count() > 0;
      expect(hasSelector || hasEmpty).toBe(true);
    } finally {
      await app.close();
    }
  });

  test('level filter checkboxes are present', async () => {
    const { app, page } = await launchApp();
    try {
      await page.evaluate(() => {
        // @ts-expect-error
        window.__reactRouter?.navigate?.('/logs');
      });
      await page.waitForTimeout(500);

      const selector = page.getByLabel(/fichier de log/i);
      if ((await selector.count()) > 0) {
        // Level checkboxes should be present
        for (const level of ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']) {
          await expect(page.getByRole('checkbox', { name: new RegExp(level, 'i') })).toBeVisible();
        }
      }
    } finally {
      await app.close();
    }
  });
});
