interface Queue {
  name: string;
  pending: number;
  processing: number;
  failed: number;
}

interface Props {
  queue: Queue;
}

export function QueueStatCard({ queue: q }: Props) {
  return (
    <article
      className="rounded-xl border border-neutral-800 bg-neutral-900 p-4"
      aria-label={`Queue ${q.name}`}
    >
      <h3 className="mb-3 truncate text-sm font-semibold text-neutral-100">{q.name}</h3>
      <dl className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-neutral-800 px-2 py-2">
          <dt className="text-xs text-neutral-500">En attente</dt>
          <dd className="mt-0.5 text-lg font-bold text-blue-400">{q.pending}</dd>
        </div>
        <div className="rounded-lg bg-neutral-800 px-2 py-2">
          <dt className="text-xs text-neutral-500">En cours</dt>
          <dd className="mt-0.5 text-lg font-bold text-orange-400">{q.processing}</dd>
        </div>
        <div className="rounded-lg bg-neutral-800 px-2 py-2">
          <dt className="text-xs text-neutral-500">Échoués</dt>
          <dd className="mt-0.5 text-lg font-bold text-red-400">{q.failed}</dd>
        </div>
      </dl>
    </article>
  );
}
