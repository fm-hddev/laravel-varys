import { IPC_CHANNELS } from '@varys/core';
import { contextBridge, ipcRenderer } from 'electron';

type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

const allowedChannels = new Set<string>(Object.values(IPC_CHANNELS));

contextBridge.exposeInMainWorld('varys', {
  invoke(channel: IpcChannel, ...args: unknown[]): Promise<unknown> {
    if (!allowedChannels.has(channel)) {
      return Promise.reject(new Error(`Unauthorized channel: ${channel}`));
    }
    return ipcRenderer.invoke(channel, ...args);
  },

  on(channel: IpcChannel, listener: (...args: unknown[]) => void): () => void {
    if (!allowedChannels.has(channel)) {
      throw new Error(`Unauthorized channel: ${channel}`);
    }
    const wrapped = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => listener(...args);
    ipcRenderer.on(channel, wrapped);
    return () => {
      ipcRenderer.removeListener(channel, wrapped);
    };
  },
});
