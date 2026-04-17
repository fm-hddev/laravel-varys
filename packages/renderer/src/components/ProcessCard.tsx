import type { Process } from '@varys/core';
import { useState } from 'react';

import { LogPanel } from '@/components/LogPanel';
import { useLogStream } from '@/hooks/useLogStream';

interface Props {
  process: Process;
}

const TYPE_BADGE: Record<Process['type'], string> = {
  docker: 'bg-blue-900 text-blue-300',
  artisan: 'bg-purple-900 text-purple-300',
  vite: 'bg-yellow-900 text-yellow-300',
  unknown: 'bg-neutral-800 text-neutral-400',
};

const STATUS_COLOR: Record<Process['status'], string> = {
  up: 'text-emerald-400',
  unhealthy: 'text-yellow-400',
  down: 'text-red-400',
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
      className="rounded-xl border border-neutral-800 bg-neutral-900 p-4"
      aria-label={`Processus ${proc.name}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-neutral-100 text-sm">{proc.name}</h3>
            <span
              className={`rounded px-1.5 py-0.5 text-xs font-medium ${TYPE_BADGE[proc.type]}`}
            >
              {proc.type}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
            <span className={`font-medium ${STATUS_COLOR[proc.status]}`}>
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
          className="shrink-0 rounded px-2 py-1 text-xs font-medium text-neutral-400 hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
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
