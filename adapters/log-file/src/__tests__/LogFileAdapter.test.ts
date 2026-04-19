import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { LogLine } from '@varys/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { LogFileAdapter } from '../LogFileAdapter.js';

describe('LogFileAdapter', () => {
  let tmpDir: string;
  let projectPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'varys-log-test-'));
    projectPath = tmpDir;
    fs.mkdirSync(path.join(tmpDir, 'storage', 'logs'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('probe() returns available:true when storage/logs exists', async () => {
    const adapter = new LogFileAdapter(tmpDir);
    const result = await adapter.probe();
    expect(result.available).toBe(true);
  });

  it('probe() returns available:false when storage/logs is absent', async () => {
    const adapter = new LogFileAdapter('/non-existent-project');
    const result = await adapter.probe();
    expect(result.available).toBe(false);
  });

  it('listLogFiles() returns .log files in storage/logs', async () => {
    const logsDir = path.join(tmpDir, 'storage', 'logs');
    fs.writeFileSync(path.join(logsDir, 'laravel.log'), '');
    fs.writeFileSync(path.join(logsDir, 'worker.log'), '');
    fs.writeFileSync(path.join(logsDir, 'not-a-log.txt'), '');

    const adapter = new LogFileAdapter(tmpDir);
    const files = await adapter.listLogFiles();

    expect(files).toContain('laravel.log');
    expect(files).toContain('worker.log');
    expect(files).not.toContain('not-a-log.txt');
  });

  it('streamAppLogs() delivers existing lines on start', async () => {
    const logsDir = path.join(tmpDir, 'storage', 'logs');
    const logFile = path.join(logsDir, 'laravel.log');
    fs.writeFileSync(
      logFile,
      '[2024-01-15 08:00:01] local.INFO: First line\n' +
        '[2024-01-15 08:00:02] local.ERROR: Second line\n',
    );

    const adapter = new LogFileAdapter(projectPath);
    const received: LogLine[] = [];

    const unsubscribe = await adapter.streamAppLogs('laravel.log', (line) => {
      received.push(line);
    });

    await new Promise((r) => setTimeout(r, 100));
    void unsubscribe();

    expect(received.length).toBeGreaterThanOrEqual(2);
    expect(received[0]?.level).toBe('INFO');
    expect(received[1]?.level).toBe('ERROR');
  });

  it('streamAppLogs() picks up newly appended lines', async () => {
    const logsDir = path.join(tmpDir, 'storage', 'logs');
    const logFile = path.join(logsDir, 'laravel.log');
    fs.writeFileSync(logFile, '[2024-01-15 08:00:01] local.INFO: Initial\n');

    const adapter = new LogFileAdapter(projectPath);
    const received: LogLine[] = [];

    const unsubscribe = await adapter.streamAppLogs('laravel.log', (line) => {
      received.push(line);
    });

    // Wait for initial lines to be read
    await new Promise((r) => setTimeout(r, 150));
    const initialCount = received.length;

    // Append new line
    fs.appendFileSync(logFile, '[2024-01-15 08:00:02] local.WARNING: New line\n');

    // Wait for watcher to fire
    await new Promise((r) => setTimeout(r, 500));

    void unsubscribe();

    expect(received.length).toBeGreaterThan(initialCount);
    const newLine = received.find((l) => l.level === 'WARNING');
    expect(newLine).toBeDefined();
  }, 10_000);

  it('streamAppLogs() Unsubscribe stops watcher', async () => {
    const logsDir = path.join(tmpDir, 'storage', 'logs');
    const logFile = path.join(logsDir, 'laravel.log');
    fs.writeFileSync(logFile, '[2024-01-15 08:00:01] local.INFO: Start\n');

    const adapter = new LogFileAdapter(projectPath);
    const received: LogLine[] = [];

    const unsubscribe = await adapter.streamAppLogs('laravel.log', (line) => {
      received.push(line);
    });

    await new Promise((r) => setTimeout(r, 100));
    void unsubscribe();

    const countAfterUnsubscribe = received.length;

    // Append after unsubscribe — should NOT be received
    fs.appendFileSync(logFile, '[2024-01-15 08:00:02] local.ERROR: After stop\n');
    await new Promise((r) => setTimeout(r, 300));

    expect(received.length).toBe(countAfterUnsubscribe);
  }, 10_000);
});
