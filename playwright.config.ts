import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env['CI'] ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    // Electron tests use custom launch — no browser needed here
  },
  // E2E tests are only run when explicitly called (not via `npm test`)
  // They require a built Electron app and VARYS_E2E=true
  projects: [
    {
      name: 'electron',
      testMatch: /e2e\/.*\.spec\.ts$/,
    },
  ],
});
