import type { LogLine } from '@varys/core';

const LOG_PATTERN =
  /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] \w+\.(DEBUG|INFO|WARNING|ERROR|CRITICAL): /;

/**
 * Parses a single Laravel log line into a LogLine.
 * Format: `[YYYY-MM-DD HH:MM:SS] env.LEVEL: message`
 *
 * Returns null for lines that don't match (stack traces, continuation lines, etc.).
 */
export function parseLogLine(raw: string): LogLine | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const match = LOG_PATTERN.exec(trimmed);
  if (!match) return null;

  const [, dateStr, level] = match;

  return {
    timestamp: new Date(dateStr!.replace(' ', 'T')),
    level: level as LogLine['level'],
    content: raw,
  };
}
