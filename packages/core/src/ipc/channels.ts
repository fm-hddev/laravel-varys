export const IPC_CHANNELS = {
  PROJECT_SET_ACTIVE_PATH: 'project:setActivePath',
  PROJECT_GET_ACTIVE_PATH: 'project:getActivePath',
  PROJECT_LIST_KNOWN_PATHS: 'project:listKnownPaths',
  PROJECT_REMOVE_KNOWN_PATH: 'project:removeKnownPath',
  PROJECT_HEALTH: 'project:health',
  PROCESSES_LIST: 'processes:list',
  EVENTS_BROADCAST: 'events:broadcast',
  EVENTS_RESET_STREAM: 'events:resetStream',
  QUEUES_STATS: 'queues:stats',
  QUEUES_FAILED: 'queues:failed',
  LOGS_LIST_FILES: 'logs:listFiles',
  STREAM_PROCESS_LOG: 'stream:processLog',
  STREAM_APP_LOG: 'stream:appLog',
  STREAM_SUBSCRIBE: 'stream:subscribe',
  STREAM_UNSUBSCRIBE: 'stream:unsubscribe',
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
