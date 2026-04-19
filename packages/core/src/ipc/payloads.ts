import type { ProjectOverrides } from '../types/context.js';
import type { Broadcast, FailedJob, HealthReport, KnownPath, LogLine, Process, QueueStats } from '../types/domain.js';

/**
 * Type map associating each IPC channel string to its request and response types.
 *
 * Convention:
 *   request  — the payload sent from renderer → main (ipcRenderer.invoke arg)
 *   response — the payload returned from main → renderer (ipcMain.handle return value)
 *
 * For push channels (stream:*), the renderer sends a subscribe/unsubscribe request
 * and receives events via ipcRenderer.on rather than invoke/handle.
 */
export interface IpcPayloadMap {
  // ─── Project ────────────────────────────────────────────────────────────────
  'project:setActivePath': {
    request: { path: string };
    response: void;
  };
  'project:getActivePath': {
    request: void;
    response: string | null;
  };
  'project:listKnownPaths': {
    request: void;
    response: KnownPath[];
  };
  'project:removeKnownPath': {
    request: { path: string };
    response: void;
  };
  'project:health': {
    request: void;
    response: HealthReport;
  };
  'project:openDialog': {
    request: void;
    response: string | null;
  };
  'project:updateAdapterConfig': {
    request: { adapterId: string; enabled: boolean };
    response: void;
  };
  'project:getOverrides': {
    request: void;
    response: {
      overrides: ProjectOverrides;
      envDefaults: { dbHost: string; dbPort: number; redisHost: string; redisPort: number; reverbHost: string; reverbPort: number; appUrl: string };
    };
  };
  'project:setOverrides': {
    request: { overrides: ProjectOverrides };
    response: void;
  };

  // ─── Processes ──────────────────────────────────────────────────────────────
  'processes:list': {
    request: void;
    response: Process[];
  };

  // ─── Events / Broadcasts ────────────────────────────────────────────────────
  'events:broadcast': {
    request: void;
    response: Broadcast[];
  };
  'events:resetStream': {
    request: void;
    response: void;
  };

  // ─── Queues ─────────────────────────────────────────────────────────────────
  'queues:stats': {
    request: void;
    response: QueueStats;
  };
  'queues:failed': {
    request: void;
    response: FailedJob[];
  };
  'queues:retryJob': {
    request: { id: string | number };
    response: void;
  };
  'queues:forgetJob': {
    request: { id: string | number };
    response: void;
  };
  'queues:purgeAll': {
    request: void;
    response: void;
  };

  // ─── Logs ───────────────────────────────────────────────────────────────────
  'logs:listFiles': {
    request: void;
    response: string[];
  };

  // ─── Streaming (push from main → renderer via webContents.send) ─────────────
  'stream:processLog': {
    request: void;
    response: LogLine; // pushed event payload
  };
  'stream:appLog': {
    request: void;
    response: LogLine; // pushed event payload
  };
  'stream:subscribe': {
    request: { type: 'processLog'; processId: string } | { type: 'appLog'; file: string };
    response: void;
  };
  'stream:unsubscribe': {
    request: { type: 'processLog'; processId: string } | { type: 'appLog'; file: string };
    response: void;
  };
}

/**
 * Helper type: extract the request type for a given channel.
 */
export type IpcRequest<C extends keyof IpcPayloadMap> = IpcPayloadMap[C]['request'];

/**
 * Helper type: extract the response type for a given channel.
 */
export type IpcResponse<C extends keyof IpcPayloadMap> = IpcPayloadMap[C]['response'];
