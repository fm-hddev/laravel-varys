export interface JobRow {
  queue: string;
  payload: string;
  attempts: number;
  available_at: number;
  created_at: number;
}

export interface FailedJobRow {
  id?: number;
  uuid: string;
  connection: string;
  queue: string;
  payload: string;
  exception: string;
  failed_at: string;
}

export interface QueueCount {
  queue: string;
  count: number;
}
