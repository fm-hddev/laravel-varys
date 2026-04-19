import { describe, expect, it } from 'vitest';

import { parseLogLine } from '../parseLogLine.js';

describe('parseLogLine', () => {
  it('parses a standard Laravel log line with DEBUG level', () => {
    const line = '[2024-01-15 08:00:01] local.DEBUG: Application booted {"key":"val"}';
    const result = parseLogLine(line);

    expect(result).not.toBeNull();
    expect(result?.level).toBe('DEBUG');
    expect(result?.timestamp).toEqual(new Date('2024-01-15T08:00:01'));
    expect(result?.content).toBe('[2024-01-15 08:00:01] local.DEBUG: Application booted {"key":"val"}');
  });

  it('parses INFO level', () => {
    const line = '[2024-01-15 08:00:02] local.INFO: User logged in {"user_id":1}';
    const result = parseLogLine(line);
    expect(result?.level).toBe('INFO');
  });

  it('parses WARNING level', () => {
    const line = '[2024-01-15 08:00:04] local.WARNING: Deprecated method called';
    const result = parseLogLine(line);
    expect(result?.level).toBe('WARNING');
  });

  it('parses ERROR level', () => {
    const line = '[2024-01-15 08:00:06] local.ERROR: Database query failed';
    const result = parseLogLine(line);
    expect(result?.level).toBe('ERROR');
  });

  it('parses CRITICAL level', () => {
    const line = '[2024-01-15 08:00:10] local.CRITICAL: Out of disk space';
    const result = parseLogLine(line);
    expect(result?.level).toBe('CRITICAL');
  });

  it('returns null for non-matching lines (stack trace)', () => {
    const line = '  #0 /var/www/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1234)';
    expect(parseLogLine(line)).toBeNull();
  });

  it('returns null for empty lines', () => {
    expect(parseLogLine('')).toBeNull();
    expect(parseLogLine('   ')).toBeNull();
  });

  it('preserves the full original line as content', () => {
    const line = '[2024-01-15 09:30:00] production.ERROR: Something {"detail":"value with spaces"}';
    const result = parseLogLine(line);
    expect(result?.content).toBe(line);
  });

  it('handles production environment prefix', () => {
    const line = '[2024-01-15 09:30:00] production.INFO: Deployed successfully';
    const result = parseLogLine(line);
    expect(result?.level).toBe('INFO');
    expect(result?.timestamp).toEqual(new Date('2024-01-15T09:30:00'));
  });
});
