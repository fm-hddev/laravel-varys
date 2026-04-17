import path from 'node:path';

import { BrowserWindow } from 'electron';

export function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const devUrl = process.env['ELECTRON_RENDERER_URL'] ?? 'http://localhost:5173';
  const isProd = process.env['NODE_ENV'] === 'production';

  if (isProd) {
    void win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  } else {
    void win.loadURL(devUrl);
  }

  return win;
}
