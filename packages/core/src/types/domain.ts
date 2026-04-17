export type ProbeResult = { available: true } | { available: false; reason: string };

export type Unsubscribe = () => void | Promise<void>;

export interface Process {
  id: string;
  name: string;
  type: 'docker' | 'artisan' | 'vite' | 'unknown';
  status: 'up' | 'unhealthy' | 'down';
  pid?: number;
  uptime?: number; // seconds
  containerId?: string;
  adapterSource: string;
}

export interface LogLine {
  timestamp: Date;
  content: string;
  level?: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
}

export interface Broadcast {
  id: string;
  channel: string;
  event: string;
  payload: unknown;
  receivedAt: Date;
}

export interface QueueStats {
  driver: 'database' | 'redis';
  queues: Array<{ name: string; pending: number; processing: number; failed: number }>;
}

export interface FailedJob {
  id: string | number;
  queue: string;
  payload: unknown;
  exception: string;
  failedAt: Date;
}

export interface HealthReport {
  adapters: Array<{ id: string; name: string; result: ProbeResult }>;
  probedAt: Date;
}

export interface KnownPath {
  label: string;
  projectPath: string;
  lastUsedAt: Date;
}
