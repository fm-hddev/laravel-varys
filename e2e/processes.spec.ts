import { test, expect } from '@playwright/test';

import { launchApp } from './helpers/electron';

test.describe('ProcessesView', () => {
  test.skip(
    !process.env['VARYS_E2E'],
    'E2E tests require built Electron app — set VARYS_E2E=true',
  );

  test('renders ProcessesView with process cards or empty state', async () => {
    const { app, page } = await launchApp();
    try {
      await page.evaluate(() => {
        // @ts-expect-error
        window.__reactRouter?.navigate?.('/processes');
      });
      await page.waitForTimeout(500);

      await expect(page.getByRole('heading', { name: /processus/i })).toBeVisible();
      // Either process cards or empty state
      const hasContent =
        (await page.getByRole('article').count()) > 0 ||
        (await page.getByText(/aucun processus/i).count()) > 0;
      expect(hasContent).toBe(true);
    } finally {
      await app.close();
    }
  });
});
