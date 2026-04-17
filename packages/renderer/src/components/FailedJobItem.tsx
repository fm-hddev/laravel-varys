import type { FailedJob } from '@varys/core';
import { useState } from 'react';

interface Props {
  job: FailedJob;
}

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString('fr-FR');
}

function firstLine(text: string): string {
  return text.split('\n')[0] ?? text;
}

export function FailedJobItem({ job }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3"
      aria-label={`Job échoué ${String(job.id)} sur la queue ${job.queue}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-xs text-neutral-400">
              #{String(job.id)}
            </span>
            <span className="rounded bg-red-950 px-1.5 py-0.5 text-xs font-medium text-red-400">
              {job.queue}
            </span>
          </div>
          <p className="mt-1 truncate text-xs text-neutral-500">
            {firstLine(job.exception)}
          </p>
          <p className="mt-0.5 text-xs text-neutral-600">{formatDateTime(job.failedAt)}</p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((o) => !o)}
          aria-expanded={expanded}
          aria-label={expanded ? 'Réduire les détails' : 'Voir les détails'}
          className="shrink-0 rounded px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          {expanded ? 'Réduire' : 'Détails'}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2">
          <div>
            <p className="mb-1 text-xs font-medium text-neutral-400">Stack trace</p>
            <pre className="overflow-x-auto rounded bg-neutral-800 p-2 text-xs text-red-300">
              {job.exception}
            </pre>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-neutral-400">Payload</p>
            <pre className="overflow-x-auto rounded bg-neutral-800 p-2 text-xs text-neutral-300">
              {JSON.stringify(job.payload, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </article>
  );
}
