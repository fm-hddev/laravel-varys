import type { LogLine as LogLineType } from '@varys/core';
import type { CSSProperties } from 'react';

interface Props {
  line: LogLineType;
}

type Level = NonNullable<LogLineType['level']>;

const LEVEL_COLOR: Record<Level, string> = {
  DEBUG: 'var(--log-debug)',
  INFO: 'var(--log-info)',
  WARNING: 'var(--log-warning)',
  ERROR: 'var(--log-error)',
  CRITICAL: 'var(--hd-violet-400)',
};

const LEVEL_BADGE_STYLE: Record<Level, CSSProperties> = {
  DEBUG: { background: 'rgba(109,79,199,0.15)', color: 'var(--log-debug)' },
  INFO: { background: 'rgba(196,181,253,0.1)', color: 'var(--log-info)' },
  WARNING: { background: 'rgba(245,158,11,0.15)', color: 'var(--log-warning)' },
  ERROR: { background: 'rgba(239,68,68,0.15)', color: 'var(--log-error)' },
  CRITICAL: { background: 'rgba(139,92,246,0.15)', color: 'var(--hd-violet-400)' },
};

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString('fr-FR', { hour12: false });
}

export function LogLine({ line }: Props) {
  const level = line.level ?? 'DEBUG';

  return (
    <div className="flex items-start gap-2 py-0.5 font-mono text-xs">
      <span className="shrink-0" style={{ color: 'var(--log-ts)' }}>{formatTime(line.timestamp)}</span>
      <span className="shrink-0 rounded px-1 py-0.5 text-xs font-medium" style={LEVEL_BADGE_STYLE[level]}>
        {level}
      </span>
      <span className="break-all" style={{ color: LEVEL_COLOR[level] }}>{line.content}</span>
    </div>
  );
}
