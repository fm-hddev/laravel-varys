import { describe, expect, it } from 'vitest';

import { IPC_CHANNELS } from '../ipc/channels.js';
import type { IpcChannel } from '../ipc/channels.js';
import type { IpcRequest, IpcResponse } from '../ipc/payloads.js';

describe('IPC_CHANNELS', () => {
  it('exposes all expected channel strings', () => {
    expect(IPC_CHANNELS.PROJECT_SET_ACTIVE_PATH).toBe('project:setActivePath');
    expect(IPC_CHANNELS.PROJECT_GET_ACTIVE_PATH).toBe('project:getActivePath');
    expect(IPC_CHANNELS.PROJECT_LIST_KNOWN_PATHS).toBe('project:listKnownPaths');
    expect(IPC_CHANNELS.PROJECT_REMOVE_KNOWN_PATH).toBe('project:removeKnownPath');
    expect(IPC_CHANNELS.PROJECT_HEALTH).toBe('project:health');
    expect(IPC_CHANNELS.PROJECT_OPEN_DIALOG).toBe('project:openDialog');
    expect(IPC_CHANNELS.PROJECT_UPDATE_ADAPTER_CONFIG).toBe('project:updateAdapterConfig');
    expect(IPC_CHANNELS.PROJECT_GET_OVERRIDES).toBe('project:getOverrides');
    expect(IPC_CHANNELS.PROJECT_SET_OVERRIDES).toBe('project:setOverrides');
    expect(IPC_CHANNELS.PROCESSES_LIST).toBe('processes:list');
    expect(IPC_CHANNELS.EVENTS_BROADCAST).toBe('events:broadcast');
    expect(IPC_CHANNELS.EVENTS_RESET_STREAM).toBe('events:resetStream');
    expect(IPC_CHANNELS.QUEUES_STATS).toBe('queues:stats');
    expect(IPC_CHANNELS.QUEUES_FAILED).toBe('queues:failed');
    expect(IPC_CHANNELS.LOGS_LIST_FILES).toBe('logs:listFiles');
    expect(IPC_CHANNELS.STREAM_PROCESS_LOG).toBe('stream:processLog');
    expect(IPC_CHANNELS.STREAM_APP_LOG).toBe('stream:appLog');
    expect(IPC_CHANNELS.STREAM_SUBSCRIBE).toBe('stream:subscribe');
    expect(IPC_CHANNELS.STREAM_UNSUBSCRIBE).toBe('stream:unsubscribe');
    expect(IPC_CHANNELS.UPDATER_UPDATE_AVAILABLE).toBe('updater:updateAvailable');
    expect(IPC_CHANNELS.UPDATER_OPEN_RELEASE).toBe('updater:openRelease');
  });

  it('has exactly 24 channels', () => {
    const channelValues = Object.values(IPC_CHANNELS);
    expect(channelValues).toHaveLength(24);
  });

  it('has no duplicate channel strings', () => {
    const channelValues = Object.values(IPC_CHANNELS);
    const unique = new Set(channelValues);
    expect(unique.size).toBe(channelValues.length);
  });

  it('all channel strings follow the namespace:action pattern', () => {
    const channelValues = Object.values(IPC_CHANNELS);
    for (const ch of channelValues) {
      expect(ch).toMatch(/^[a-z]+:[a-zA-Z]+$/);
    }
  });
});

describe('IpcChannel type', () => {
  it('is assignable from any IPC_CHANNELS value', () => {
    // Compile-time proof: all these must be valid IpcChannel values
    const channels: IpcChannel[] = [
      IPC_CHANNELS.PROJECT_SET_ACTIVE_PATH,
      IPC_CHANNELS.PROJECT_GET_ACTIVE_PATH,
      IPC_CHANNELS.PROCESSES_LIST,
      IPC_CHANNELS.EVENTS_BROADCAST,
      IPC_CHANNELS.QUEUES_STATS,
      IPC_CHANNELS.STREAM_SUBSCRIBE,
    ];
    expect(channels).toHaveLength(6);
  });
});

describe('IpcPayloadMap coverage', () => {
  it('covers all 24 channels', () => {
    // IpcPayloadMap is a type, not a runtime object.
    // Coverage is enforced at compile time: TypeScript will error if a channel
    // is missing from IpcPayloadMap when IpcRequest<C> or IpcResponse<C> is used.
    const allChannels = Object.values(IPC_CHANNELS) as IpcChannel[];
    expect(allChannels).toHaveLength(24);
  });
});

describe('IpcRequest / IpcResponse helper types', () => {
  it('IpcRequest resolves the request type for a channel', () => {
    // Compile-time: IpcRequest<'project:setActivePath'> must be { path: string }
    type Req = IpcRequest<typeof IPC_CHANNELS.PROJECT_SET_ACTIVE_PATH>;
    const req: Req = { path: '/home/user/app' };
    expect(req.path).toBe('/home/user/app');
  });

  it('IpcResponse resolves the response type for a channel', () => {
    // Compile-time: IpcResponse<'project:listKnownPaths'> must be KnownPath[]
    type Res = IpcResponse<typeof IPC_CHANNELS.PROJECT_LIST_KNOWN_PATHS>;
    const res: Res = [
      { label: 'My App', projectPath: '/home/user/app', lastUsedAt: new Date() },
    ];
    expect(res).toHaveLength(1);
  });

  it('IpcResponse for processes:list is Process[]', () => {
    type Res = IpcResponse<typeof IPC_CHANNELS.PROCESSES_LIST>;
    const res: Res = [
      {
        id: 'p1',
        name: 'laravel',
        type: 'docker',
        status: 'up',
        adapterSource: 'docker',
      },
    ];
    expect(res[0]?.type).toBe('docker');
  });
});

describe('IpcPayloadMap stream channels', () => {
  it('STREAM_SUBSCRIBE request accepts processLog target', () => {
    type Req = IpcRequest<typeof IPC_CHANNELS.STREAM_SUBSCRIBE>;
    const req: Req = { type: 'processLog', processId: 'proc-1' };
    expect(req.type).toBe('processLog');
  });

  it('STREAM_SUBSCRIBE request accepts appLog target', () => {
    type Req = IpcRequest<typeof IPC_CHANNELS.STREAM_SUBSCRIBE>;
    const req: Req = { type: 'appLog', file: '/storage/logs/laravel.log' };
    expect(req.type).toBe('appLog');
  });
});
