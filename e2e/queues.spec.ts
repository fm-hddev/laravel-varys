import { test, expect } from '@playwright/test';

import { launchApp } from './helpers/electron';

test.describe('QueuesView', () => {
  test.skip(
    !process.env['VARYS_E2E'],
    'E2E tests require built Electron app — set VARYS_E2E=true',
  );

  test('renders QueuesView with stats or empty state', async () => {
    const { app, page } = await launchApp();
    try {
      await page.evaluate(() => {
        // @ts-expect-error
        window.__reactRouter?.navigate?.('/queues');
      });
      await page.waitForTimeout(300);

      await expect(page.getByRole('heading', { name: /queues/i })).toBeVisible();
      // Either stats or empty state
      const hasContent =
        (await page.getByRole('article').count()) > 0 ||
        (await page.getByText(/aucune queue/i).count()) > 0 ||
        (await page.getByText(/inaccessibles/i).count()) > 0;
      expect(hasContent).toBe(true);
    } finally {
      await app.close();
    }
  });
});
