import type { Broadcast } from '@varys/core';
import { useState } from 'react';

interface Props {
  broadcast: Broadcast;
  index: number;
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString('fr-FR', { hour12: false });
}

export function BroadcastItem({ broadcast: b, index }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isAlt = index % 2 === 1;

  return (
    <article
      className={`rounded-lg border border-neutral-800 px-4 py-3 ${isAlt ? 'bg-neutral-900' : 'bg-neutral-950'}`}
      aria-label={`Événement ${b.event} sur ${b.channel}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-indigo-900 px-1.5 py-0.5 text-xs font-medium text-indigo-300">
              {b.channel}
            </span>
            <span className="truncate text-sm font-semibold text-neutral-100">{b.event}</span>
          </div>
          <p className="mt-0.5 text-xs text-neutral-500">
            {formatTime(b.receivedAt)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((o) => !o)}
          aria-expanded={expanded}
          aria-label={expanded ? 'Réduire le payload' : 'Voir le payload'}
          className="shrink-0 rounded px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          {expanded ? 'Réduire' : 'Payload'}
        </button>
      </div>

      {expanded && (
        <pre className="mt-2 overflow-x-auto rounded bg-neutral-800 p-2 text-xs text-neutral-300">
          {JSON.stringify(b.payload, null, 2)}
        </pre>
      )}
    </article>
  );
}
