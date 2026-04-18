import { builtinModules } from 'node:module';
import { dirname, resolve } from 'node:path';

import { defineConfig } from 'vite';

const MONOREPO_ROOT = resolve(__dirname, '../..');

export default defineConfig({
  resolve: {
    // Force CJS exports condition so packages like `pg` use ./lib/index.js
    // instead of ./esm/index.mjs — avoids TDZ bugs in Rollup CJS interop.
    conditions: ['require', 'node', 'default'],
    alias: {
      '@varys/core': resolve(__dirname, '../../packages/core/src/index.ts'),
    },
  },
  plugins: [
    {
      // Intercept .node binaries before any other plugin touches them.
      // Resolve to absolute path so the generated require() works from any chunk location.
      name: 'externalize-node-binaries',
      enforce: 'pre',
      resolveId(id, importer) {
        if (!id.endsWith('.node')) return;
        // Resolve to absolute so the generated require() works from any chunk location
        const abs = id.startsWith('/')
          ? id
          : resolve(importer ? dirname(importer) : process.cwd(), id);
        return { id: abs, external: true };
      },
    },
    {
      // ws has optional native deps (bufferutil, utf-8-validate) that improve
      // performance but are not required. When bundled by Rollup/Vite they can't
      // be resolved, so we stub them and also patch ws's buffer-util.js to
      // skip the native-dep path entirely via WS_NO_BUFFER_UTIL.
      name: 'stub-optional-ws-native-deps',
      enforce: 'pre',
      resolveId(id) {
        if (id === 'bufferutil' || id === 'utf-8-validate') {
          return '\0stub:' + id;
        }
      },
      load(id) {
        if (id.startsWith('\0stub:')) {
          return 'module.exports = {};';
        }
      },
      transform(code, id) {
        // Patch ws's buffer-util.js: skip the native bufferutil block entirely
        // so the pure-JS mask/unmask implementations are always used.
        if (id.includes('/ws/lib/buffer-util') || id.includes('\\ws\\lib\\buffer-util')) {
          return code.replace(
            "if (!process.env.WS_NO_BUFFER_UTIL) {",
            "if (false) {"
          );
        }
      },
    },
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['cjs'],
      fileName: () => 'index.js',
    },
    outDir: '.vite/build',
    emptyOutDir: true,
    commonjsOptions: {
      // Prevent @rollup/plugin-commonjs from processing these packages.
      // Their CJS requires() will remain as-is and Rollup will externalize them.
      ignore: ['pg', 'pg-native', 'mysql2', 'mysql2/promise', 'ioredis', 'better-sqlite3'],
    },
    rollupOptions: {
      output: {
        // Prevent dynamic-import code-splitting which causes CJS/ESM interop TDZ bugs
        // (e.g. adapter's `await import('pg')` creating a chunk with circular init order)
        inlineDynamicImports: true,
      },
      external(id, _parentId, isResolved) {
        // Always bundle @varys/* packages (adapters + core) inline
        if (id.startsWith('@varys/')) return false;
        // Native binaries
        if (id.endsWith('.node')) return true;
        // DB/cache packages have internal circular deps that break when bundled by Rollup.
        // Must be kept external so Node resolves them natively at runtime.
        if (
          id === 'pg' || id.startsWith('pg/') ||
          id === 'mysql2' || id.startsWith('mysql2/') ||
          id === 'ioredis' || id.startsWith('ioredis/') ||
          id === 'better-sqlite3' || id.startsWith('better-sqlite3/') ||
          id === 'bufferutil' || id === 'utf-8-validate' ||
          id === 'ws' || id.startsWith('ws/')
        ) return true;
        // When resolved to an absolute path: externalize anything outside our src/
        if (isResolved) {
          return id.includes('/node_modules/');
        }
        // Electron and Node built-ins
        if (id === 'electron' || builtinModules.includes(id) || id.startsWith('node:')) return true;
        // All npm package ids (not relative or virtual)
        if (!id.startsWith('.') && !id.startsWith('/') && !id.startsWith('\0')) return true;
        return false;
      },
    },
  },
});
