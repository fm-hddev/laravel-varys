import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Run Testcontainers test files sequentially to avoid Docker resource contention
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
