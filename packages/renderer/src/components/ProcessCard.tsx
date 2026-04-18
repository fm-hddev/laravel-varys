import type { Process } from '@varys/core';
import { useState } from 'react';
import type { CSSProperties } from 'react';

import { LogPanel } from '@/components/LogPanel';
import { useLogStream } from '@/hooks/useLogStream';

interface Props {
  process: Process;
}

const TYPE_BADGE_STYLE: Record<Process['type'], CSSProperties> = {
  docker: { background: '#1e3a5f', color: '#93c5fd' },
  artisan: { background: 'var(--bg-card)', color: 'var(--hd-violet-400)', border: '1px solid var(--border)' },
  vite: { background: '#422006', color: '#fcd34d' },
  unknown: { background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' },
};

const STATUS_COLOR: Record<Process['status'], string> = {
  up: '#34d399',
  unhealthy: '#fbbf24',
  down: '#f87171',
};

const STATUS_LABEL: Record<Process['status'], string> = {
  up: 'En ligne',
  unhealthy: 'Dégradé',
  down: 'Hors ligne',
};

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export function ProcessCard({ process: proc }: Props) {
  const [logsOpen, setLogsOpen] = useState(false);
  const lines = useLogStream(proc.id, logsOpen);

  return (
    <article
      className="rounded-xl p-4"
      style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
      aria-label={`Processus ${proc.name}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{proc.name}</h3>
            <span
              className="rounded px-1.5 py-0.5 text-xs font-medium"
              style={TYPE_BADGE_STYLE[proc.type]}
            >
              {proc.type}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span className="font-medium" style={{ color: STATUS_COLOR[proc.status] }}>
              {STATUS_LABEL[proc.status]}
            </span>
            {proc.uptime !== undefined && (
              <span>Uptime : {formatUptime(proc.uptime)}</span>
            )}
            {proc.pid !== undefined && <span>PID {proc.pid}</span>}
            <span className="italic">{proc.adapterSource}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setLogsOpen((o) => !o)}
          aria-expanded={logsOpen}
          aria-label={`${logsOpen ? 'Fermer' : 'Ouvrir'} les logs de ${proc.name}`}
          className="shrink-0 rounded px-2 py-1 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          style={{ color: 'var(--text-3)', background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          {logsOpen ? 'Fermer logs' : 'Logs'}
        </button>
      </div>

      {logsOpen && (
        <div className="mt-3">
          <LogPanel lines={lines} />
        </div>
      )}
    </article>
  );
}
