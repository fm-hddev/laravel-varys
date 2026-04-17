import type { Broadcast, FailedJob, LogLine, Process, ProbeResult, QueueStats, Unsubscribe } from './domain.js';

export type StreamTarget =
  | { type: 'processLog'; processId: string }
  | { type: 'appLog'; file: string };

export interface DataSourceAdapter {
  /** Unique identifier for this adapter instance */
  readonly id: string;

  /** Human-readable name for display */
  readonly name: string;

  /**
   * Check whether the underlying data source is reachable.
   * Must resolve quickly (< 2s) — called on app startup and periodically.
   */
  probe(): Promise<ProbeResult>;

  /**
   * Return the current list of detected processes managed by this adapter.
   */
  listProcesses(): Promise<Process[]>;

  /**
   * Stream log lines from a process or app log file.
   * Calls `onLine` for each new line. Returns an Unsubscribe handle.
   */
  streamLog(target: StreamTarget, onLine: (line: LogLine) => void): Promise<Unsubscribe>;

  /**
   * Return the most recent broadcast events captured from the Reverb channel.
   */
  listBroadcasts(): Promise<Broadcast[]>;

  /**
   * Clear the in-memory broadcast buffer and reset the stream.
   */
  resetBroadcastStream(): Promise<void>;

  /**
   * Return current queue statistics (pending, processing, failed counts per queue).
   */
  getQueueStats(): Promise<QueueStats>;

  /**
   * Return the list of failed jobs from the queue backend.
   */
  listFailedJobs(): Promise<FailedJob[]>;
}
