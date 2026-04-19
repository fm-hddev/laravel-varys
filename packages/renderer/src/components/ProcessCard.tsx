import { TerminalWindow } from '@phosphor-icons/react';
import type { Process } from '@varys/core';
import { useState } from 'react';

import { LogPanel } from '@/components/LogPanel';
import { useLogStream } from '@/hooks/useLogStream';

interface Props {
  process: Process;
}

const STATUS_CONFIG: Record<Process['status'], { color: string; label: string; pulse: boolean }> = {
  up:        { color: 'var(--hd-emerald-400)', label: 'En ligne',   pulse: true  },
  unhealthy: { color: 'var(--hd-warning-500)', label: 'Dégradé',    pulse: false },
  down:      { color: '#6B7280',               label: 'Hors ligne', pulse: false },
};

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export function ProcessCard({ process: proc }: Props) {
  const [logsOpen, setLogsOpen] = useState(false);
  const lines = useLogStream(proc.id, logsOpen);
  const s = STATUS_CONFIG[proc.status];

  return (
    <article
      className="flex flex-col gap-2.5 rounded-xl p-4 transition-[border-color,box-shadow]"
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${proc.status === 'down' ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`,
      }}
      aria-label={`Processus ${proc.name}`}
    >
      {/* Top row: name/adapter + status */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div
            className="text-sm font-bold"
            style={{ fontFamily: 'var(--hd-font-mono)', color: 'var(--text-1)' }}
          >
            {proc.name}
          </div>
          <div className="mt-0.5 text-[10.5px]" style={{ color: 'var(--text-muted)' }}>
            {proc.type}
          </div>
        </div>

        {/* Status dot */}
        <span
          className="flex shrink-0 items-center gap-1.5 text-xs font-semibold"
          style={{ color: s.color }}
        >
          <span
            className={s.pulse ? 'status-dot-pulse' : ''}
            style={{
              display: 'inline-block',
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: s.color,
              flexShrink: 0,
            }}
          />
          {s.label}
        </span>
      </div>

      {/* Bottom row: uptime + Logs button */}
      <div className="flex items-center justify-between">
        <span
          className="text-[11px]"
          style={{
            fontFamily: 'var(--hd-font-mono)',
            color: proc.status === 'down' ? 'var(--hd-danger-500)' : 'var(--text-muted)',
          }}
        >
          {proc.uptime !== undefined
            ? `Uptime · ${formatUptime(proc.uptime)}`
            : proc.adapterSource}
        </span>

        <button
          type="button"
          onClick={() => setLogsOpen((o) => !o)}
          aria-expanded={logsOpen}
          aria-label={`${logsOpen ? 'Fermer' : 'Ouvrir'} les logs de ${proc.name}`}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hd-violet-400)] hover:bg-[var(--bg-card-alt)] hover:border-[var(--border-alt)]"
          style={{
            color: 'var(--text-muted)',
            background: 'transparent',
            border: '1px solid var(--border)',
          }}
        >
          <TerminalWindow size={13} />
          {logsOpen ? 'Fermer' : 'Logs'}
        </button>
      </div>

      {logsOpen && (
        <div className="mt-1">
          <LogPanel lines={lines} />
        </div>
      )}
    </article>
  );
}
