import type { LogLine } from '@varys/core';
import { useEffect, useRef } from 'react';

interface Props {
  lines: LogLine[];
  className?: string;
}

const LEVEL_COLORS: Record<string, string> = {
  DEBUG: 'var(--log-debug)',
  INFO: 'var(--log-info)',
  WARNING: 'var(--log-warning)',
  ERROR: 'var(--log-error)',
  CRITICAL: 'var(--log-error)',
};

export function LogPanel({ lines, className = '' }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  if (lines.length === 0) {
    return (
      <div
        className={`flex flex-col overflow-hidden rounded-lg px-4 py-3 font-mono text-xs ${className}`}
        style={{ background: 'var(--log-bg)', border: '1px solid var(--log-border)' }}
      >
        <p style={{ color: 'var(--log-ts)' }}>En attente de logs…</p>
      </div>
    );
  }

  return (
    <div
      role="log"
      aria-live="polite"
      aria-label="Logs du processus"
      className={`flex h-full flex-col overflow-hidden rounded-lg font-mono text-xs ${className}`}
      style={{ background: 'var(--log-bg)', border: '1px solid var(--log-border)' }}
    >
      <div className="overflow-y-auto px-4 py-3">
        {lines.map((line, i) => {
          const color = line.level ? (LEVEL_COLORS[line.level] ?? 'var(--log-info)') : 'var(--log-info)';
          return (
            <div key={i} className="whitespace-pre-wrap break-all" style={{ color }}>
              <span className="select-none" style={{ color: 'var(--log-ts)' }}>
                {line.timestamp instanceof Date
                  ? line.timestamp.toLocaleTimeString()
                  : String(line.timestamp)}{' '}
              </span>
              {line.content}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
