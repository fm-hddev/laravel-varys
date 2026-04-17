import type { LogLine } from '@varys/core';
import { useEffect, useRef } from 'react';

interface Props {
  lines: LogLine[];
}

const LEVEL_COLORS: Record<string, string> = {
  DEBUG: 'text-neutral-500',
  INFO: 'text-neutral-300',
  WARNING: 'text-yellow-400',
  ERROR: 'text-red-400',
  CRITICAL: 'text-red-300 font-bold',
};

export function LogPanel({ lines }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  if (lines.length === 0) {
    return (
      <div className="rounded-lg bg-neutral-950 px-4 py-3">
        <p className="text-xs text-neutral-600">En attente de logs…</p>
      </div>
    );
  }

  return (
    <div
      role="log"
      aria-live="polite"
      aria-label="Logs du processus"
      className="max-h-48 overflow-y-auto rounded-lg bg-neutral-950 px-4 py-3 font-mono text-xs"
    >
      {lines.map((line, i) => {
        const colorClass = line.level ? (LEVEL_COLORS[line.level] ?? 'text-neutral-300') : 'text-neutral-300';
        return (
          <div key={i} className={`whitespace-pre-wrap break-all ${colorClass}`}>
            <span className="text-neutral-600 select-none">
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
  );
}
