import { MakerDMG } from '@electron-forge/maker-dmg';
import { VitePlugin } from '@electron-forge/plugin-vite';
import type { ForgeConfig } from '@electron-forge/shared-types';

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
  plugins: [
    new VitePlugin({
      // Build main + preload
      build: [
        {
          entry: 'src/index.ts',
          config: 'vite.main.config.mts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.mts',
          target: 'preload',
        },
      ],
      // Renderer is built by the renderer package
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
