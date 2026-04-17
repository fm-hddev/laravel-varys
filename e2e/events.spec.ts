import { test, expect } from '@playwright/test';

import { launchApp } from './helpers/electron';

test.describe('EventsView', () => {
  test.skip(
    !process.env['VARYS_E2E'],
    'E2E tests require built Electron app — set VARYS_E2E=true',
  );

  test('renders EventsView with pause/resume buttons', async () => {
    const { app, page } = await launchApp();
    try {
      // Navigate to events
      await page.evaluate(() => {
        // @ts-expect-error
        window.__reactRouter?.navigate?.('/events');
      });
      await page.waitForTimeout(300);

      // Check page structure
      await expect(page.getByRole('heading', { name: /événements/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /pause/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /vider/i })).toBeVisible();
    } finally {
      await app.close();
    }
  });

  test('filter inputs are present and functional', async () => {
    const { app, page } = await launchApp();
    try {
      await page.evaluate(() => {
        // @ts-expect-error
        window.__reactRouter?.navigate?.('/events');
      });
      await page.waitForTimeout(300);

      const channelInput = page.getByLabel(/filtrer par channel/i);
      const eventInput = page.getByLabel(/filtrer par événement/i);
      await expect(channelInput).toBeVisible();
      await expect(eventInput).toBeVisible();

      await channelInput.fill('test-channel');
      await expect(channelInput).toHaveValue('test-channel');
    } finally {
      await app.close();
    }
  });
});
