import fs from 'node:fs';
import path from 'node:path';

import type {
  Broadcast,
  DataSourceAdapter,
  FailedJob,
  LogLine,
  Process,
  ProjectContext,
  ProbeResult,
  QueueStats,
  StreamTarget,
  Unsubscribe,
} from '@varys/core';

/**
 * Parses a .env file (KEY=VALUE, one per line) into a plain object.
 * Lines starting with # and empty lines are ignored.
 * Values are trimmed of surrounding quotes (single or double).
 */
function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    let value = line.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

/**
 * Adapter that reads a Laravel .env file to provide ProjectContext.
 * It does not monitor processes or queues — those methods return empty/no-op.
 */
export class DotenvAdapter implements DataSourceAdapter {
  readonly id = 'dotenv';
  readonly name = 'DotenvAdapter';

  constructor(private readonly envPath: string) {}

  probe(): Promise<ProbeResult> {
    try {
      fs.accessSync(this.envPath, fs.constants.R_OK);
      parseEnvFile(fs.readFileSync(this.envPath, 'utf8'));
      return Promise.resolve({ available: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return Promise.resolve({ available: false, reason: message });
    }
  }

  buildContext(projectPath: string): Promise<ProjectContext> {
    let content: string;
    try {
      content = fs.readFileSync(this.envPath, 'utf8');
    } catch (err) {
      return Promise.reject(err instanceof Error ? err : new Error(String(err)));
    }
    const env = parseEnvFile(content);

    const redisPortRaw = env['REDIS_PORT'];
    const redisPort =
      redisPortRaw !== undefined && redisPortRaw !== '' ? parseInt(redisPortRaw, 10) : 6379;

    const dbRaw = env['DB_CONNECTION'];
    const dbConnection =
      dbRaw === 'mysql' || dbRaw === 'pgsql' || dbRaw === 'sqlite' ? dbRaw : undefined;

    const reverbRaw = env['REVERB_SCALING_ENABLED'];
    const reverbScalingEnabled = reverbRaw === 'true' || reverbRaw === '1';

    return Promise.resolve({
      projectPath,
      env,
      composeProjectName: env['COMPOSE_PROJECT_NAME'] ?? path.basename(projectPath),
      dbConnection,
      reverbScalingEnabled,
      redisHost: env['REDIS_HOST'] ?? '127.0.0.1',
      redisPort: Number.isNaN(redisPort) ? 6379 : redisPort,
    });
  }

  listProcesses(): Promise<Process[]> {
    return Promise.resolve([]);
  }

  streamLog(_target: StreamTarget, _onLine: (line: LogLine) => void): Promise<Unsubscribe> {
    return Promise.resolve(() => undefined);
  }

  listBroadcasts(): Promise<Broadcast[]> {
    return Promise.resolve([]);
  }

  resetBroadcastStream(): Promise<void> {
    return Promise.resolve();
  }

  getQueueStats(): Promise<QueueStats> {
    return Promise.resolve({ driver: 'database', queues: [] });
  }

  listFailedJobs(): Promise<FailedJob[]> {
    return Promise.resolve([]);
  }
}
