import type { IpcPayloadMap } from '@varys/core';

type VoidRequest<C extends keyof IpcPayloadMap> =
  IpcPayloadMap[C]['request'] extends void
    ? () => Promise<IpcPayloadMap[C]['response']>
    : (payload: IpcPayloadMap[C]['request']) => Promise<IpcPayloadMap[C]['response']>;

interface VarysApi {
  invoke<C extends keyof IpcPayloadMap>(
    channel: C,
    ...args: IpcPayloadMap[C]['request'] extends void ? [] : [IpcPayloadMap[C]['request']]
  ): Promise<IpcPayloadMap[C]['response']>;
  on<C extends keyof IpcPayloadMap>(
    channel: C,
    listener: (payload: IpcPayloadMap[C]['response']) => void,
  ): () => void;
}

declare global {
  interface Window {
    varys: VarysApi;
  }
}

export {};
