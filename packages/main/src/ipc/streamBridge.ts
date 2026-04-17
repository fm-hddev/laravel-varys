import type { IpcChannel } from '@varys/core';
import { BrowserWindow } from 'electron';

export function pushToRenderer(channel: IpcChannel, payload: unknown): void {
  const win = BrowserWindow.getAllWindows()[0];
  win?.webContents.send(channel, payload);
}
