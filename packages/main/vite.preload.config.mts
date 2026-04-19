import { builtinModules } from 'node:module';
import { resolve } from 'node:path';

import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@varys/core': resolve(__dirname, '../../packages/core/src/index.ts'),
    },
  },
  build: {
    lib: {
      entry: 'src/preload.ts',
      formats: ['cjs'],
      fileName: () => 'preload.js',
    },
    outDir: '.vite/build',
    emptyOutDir: false,
    rollupOptions: {
      external: (id) =>
        id === 'electron' ||
        builtinModules.includes(id) ||
        id.startsWith('node:'),
    },
  },
});
