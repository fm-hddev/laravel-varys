import type { LogLine as LogLineType } from '@varys/core';

interface Props {
  line: LogLineType;
}

const LEVEL_CLASS: Record<NonNullable<LogLineType['level']>, string> = {
  DEBUG: 'text-neutral-500',
  INFO: 'text-blue-400',
  WARNING: 'text-yellow-400',
  ERROR: 'text-red-400',
  CRITICAL: 'text-violet-400',
};

const LEVEL_BADGE: Record<NonNullable<LogLineType['level']>, string> = {
  DEBUG: 'bg-neutral-800 text-neutral-500',
  INFO: 'bg-blue-950 text-blue-400',
  WARNING: 'bg-yellow-950 text-yellow-400',
  ERROR: 'bg-red-950 text-red-400',
  CRITICAL: 'bg-violet-950 text-violet-400',
};

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString('fr-FR', { hour12: false });
}

export function LogLine({ line }: Props) {
  const level = line.level ?? 'DEBUG';
  const textClass = LEVEL_CLASS[level];
  const badgeClass = LEVEL_BADGE[level];

  return (
    <div className="flex items-start gap-2 py-0.5 font-mono text-xs">
      <span className="shrink-0 text-neutral-600">{formatTime(line.timestamp)}</span>
      <span className={`shrink-0 rounded px-1 py-0.5 text-xs font-medium ${badgeClass}`}>
        {level}
      </span>
      <span className={`break-all ${textClass}`}>{line.content}</span>
    </div>
  );
}
