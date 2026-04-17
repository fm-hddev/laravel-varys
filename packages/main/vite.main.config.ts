import { builtinModules } from 'node:module';

import { defineConfig } from 'vite';

const ADAPTER_EXTERNALS = [
  '@varys/adapter-docker',
  '@varys/adapter-artisan-process',
  '@varys/adapter-vite-process',
  '@varys/adapter-log-file',
  '@varys/adapter-laravel-queue',
  '@varys/adapter-reverb-redis',
  '@varys/adapter-dotenv',
  '@varys/adapter-varys-agent',
  '@varys/core',
];

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['cjs'],
      fileName: () => 'index.js',
    },
    outDir: '.vite/build',
    emptyOutDir: true,
    rollupOptions: {
      external: [
        'electron',
        ...builtinModules,
        ...builtinModules.map((m) => `node:${m}`),
        ...ADAPTER_EXTERNALS,
        'pino',
        'uuid',
        'zod',
      ],
    },
  },
});
