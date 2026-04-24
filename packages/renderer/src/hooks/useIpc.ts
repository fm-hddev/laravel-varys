import type { IpcPayloadMap } from '@varys/core';

export function useIpc() {
  return {
    setActivePath: (path: string) =>
      window.varys.invoke('project:setActivePath', { path }),
    getActivePath: () => window.varys.invoke('project:getActivePath'),
    listKnownPaths: () => window.varys.invoke('project:listKnownPaths'),
    removeKnownPath: (path: string) =>
      window.varys.invoke('project:removeKnownPath', { path }),
    getHealth: () => window.varys.invoke('project:health'),
    openDialog: () => window.varys.invoke('project:openDialog'),
    updateAdapterConfig: (adapterId: string, enabled: boolean) =>
      window.varys.invoke('project:updateAdapterConfig', { adapterId, enabled }),
    listProcesses: () => window.varys.invoke('processes:list'),
    getBroadcasts: () => window.varys.invoke('events:broadcast'),
    resetStream: () => window.varys.invoke('events:resetStream'),
    getQueueStats: () => window.varys.invoke('queues:stats'),
    getFailedJobs: () => window.varys.invoke('queues:failed'),
    retryFailedJob: (id: string | number) => window.varys.invoke('queues:retryJob', { id }),
    forgetFailedJob: (id: string | number) => window.varys.invoke('queues:forgetJob', { id }),
    purgeAllFailedJobs: () => window.varys.invoke('queues:purgeAll'),
    listLogFiles: () => window.varys.invoke('logs:listFiles'),
    subscribe: (payload: IpcPayloadMap['stream:subscribe']['request']) =>
      window.varys.invoke('stream:subscribe', payload),
    unsubscribe: (payload: IpcPayloadMap['stream:unsubscribe']['request']) =>
      window.varys.invoke('stream:unsubscribe', payload),
    onProcessLog: (listener: (line: IpcPayloadMap['stream:processLog']['response']) => void) =>
      window.varys.on('stream:processLog', listener),
    getOverrides: () => window.varys.invoke('project:getOverrides'),
    setOverrides: (overrides: Record<string, unknown>) =>
      window.varys.invoke('project:setOverrides', { overrides }),
  };
}
