import path from 'node:path';

import { BrowserWindow } from 'electron';

// Injected by @electron-forge/plugin-vite during dev (electron-forge start).
// Undefined in production builds.
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;

export function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    icon: path.join(__dirname, '../../build/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (typeof MAIN_WINDOW_VITE_DEV_SERVER_URL !== 'undefined' && MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    void win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    // Production: renderer is at .vite/renderer/main_window/index.html
    // __dirname = .vite/build/ → go up one level to .vite/
    void win.loadFile(path.join(__dirname, '..', 'renderer', 'main_window', 'index.html'));
  }

  return win;
}
