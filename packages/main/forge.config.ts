import fs from 'node:fs';
import { builtinModules } from 'node:module';
import path from 'node:path';

import { MakerDMG } from '@electron-forge/maker-dmg';
import { VitePlugin } from '@electron-forge/plugin-vite';
import type { ForgeConfig } from '@electron-forge/shared-types';
import { build as viteBuild } from 'vite';

const config: ForgeConfig = {
  packagerConfig: {
    name: 'Varys',
    executableName: 'varys',
    appBundleId: 'com.fredmoras8.varys',
    asar: {
      // Native modules that must be excluded from asar
      unpack: '{node_modules/better-sqlite3,node_modules/@mapbox/node-pre-gyp}/**',
    },
    derefSymlinks: true,
  },
  rebuildConfig: {},
  makers: [new MakerDMG({ name: 'Varys' })],
  hooks: {
    // Runs after source is copied to temp build path, before asar creation.
    // We use this to:
    // 1. Build the preload script (VitePlugin doesn't reliably build it)
    // 2. Copy the renderer dist to the expected location inside the asar
    packageAfterCopy: async (_forgeConfig, buildPath) => {
      // 1. Build preload into the temp build path
      await viteBuild({
        configFile: false,
        logLevel: 'warn',
        resolve: {
          alias: {
            '@varys/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
          },
        },
        build: {
          lib: {
            entry: path.resolve(__dirname, 'src/preload.ts'),
            formats: ['cjs'],
            fileName: () => 'preload.js',
          },
          outDir: path.resolve(buildPath, '.vite/build'),
          emptyOutDir: false,
          rollupOptions: {
            external: (id: string) =>
              id === 'electron' ||
              builtinModules.includes(id) ||
              id.startsWith('node:'),
          },
        },
      });

      // 2. Copy renderer dist to the location window.ts expects
      const srcRenderer = path.resolve(__dirname, '../renderer/dist');
      const destRenderer = path.resolve(buildPath, '.vite/renderer/main_window');
      await fs.promises.cp(srcRenderer, destRenderer, { recursive: true });
    },
  },
  plugins: [
    new VitePlugin({
      // Only build main process — preload and renderer are handled in hooks
      build: [
        {
          entry: 'src/index.ts',
          config: 'vite.main.config.mts',
          target: 'main',
        },
      ],
      // Renderer dev server (used by electron-forge start only)
      renderer: [
        {
          name: 'main_window',
          config: '../renderer/vite.config.ts',
        },
      ],
    }),
  ],
};

export default config;
