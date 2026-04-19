import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';

import { launchApp } from './helpers/electron';

const ROUTES = ['/welcome', '/processes', '/events', '/queues', '/logs', '/settings'];

test.describe('Accessibility (axe-core)', () => {
  test.skip(
    !process.env['VARYS_E2E'],
    'E2E tests require built Electron app — set VARYS_E2E=true',
  );

  for (const route of ROUTES) {
    test(`no critical axe violations on ${route}`, async () => {
      const { app, page } = await launchApp();
      try {
        if (route !== '/welcome') {
          await page.evaluate((r) => {
            // @ts-expect-error
            window.__reactRouter?.navigate?.(r);
          }, route);
          await page.waitForTimeout(300);
        }

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa'])
          .analyze();

        const criticalViolations = results.violations.filter(
          (v) => v.impact === 'critical',
        );

        if (criticalViolations.length > 0) {
          console.warn(
            `[a11y] ${route}: ${criticalViolations.length} critical violation(s)`,
            criticalViolations.map((v) => `${v.id}: ${v.description}`),
          );
        }

        // Fail on critical violations only
        expect(criticalViolations).toHaveLength(0);
      } finally {
        await app.close();
      }
    });
  }
});
