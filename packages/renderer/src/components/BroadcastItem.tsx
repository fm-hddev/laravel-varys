import type { Broadcast } from '@varys/core';
import { useState } from 'react';

interface Props {
  broadcast: Broadcast;
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString('fr-FR', { hour12: false });
}

export function BroadcastItem({ broadcast: b }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div aria-label={`Événement ${b.event} sur ${b.channel}`}>
      <div
        className="flex items-center gap-2.5 px-4 py-2.5 transition-colors"
        style={{ borderBottom: '1px solid var(--border)' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-card-alt)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
      >
        <span
          className="shrink-0 rounded px-1.5 py-0.5 text-xs font-medium"
          style={{ background: 'rgba(109,40,217,0.15)', color: 'var(--text-3)', border: '1px solid rgba(109,40,217,0.3)' }}
        >
          {b.channel}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{b.event}</span>
        <span className="shrink-0 font-mono text-xs" style={{ color: 'var(--text-muted, #6B7280)' }}>
          {formatTime(b.receivedAt)}
        </span>
        <button
          type="button"
          onClick={() => setExpanded((o) => !o)}
          aria-expanded={expanded}
          aria-label={expanded ? 'Réduire le payload' : 'Voir le payload'}
          className="shrink-0 rounded px-2 py-1 text-xs transition-colors"
          style={{ color: 'var(--hd-violet-400)', border: '1px solid var(--hd-violet-500)' }}
        >
          {expanded ? 'Réduire' : 'Payload'}
        </button>
      </div>

      {expanded && (
        <div
          className="overflow-x-auto px-4 py-2.5 font-mono text-xs"
          style={{ background: 'var(--log-bg)', color: 'var(--log-info)' }}
        >
          <pre>{JSON.stringify(b.payload, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
