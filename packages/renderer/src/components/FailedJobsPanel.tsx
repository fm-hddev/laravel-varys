import type { FailedJob } from '@varys/core';

import { FailedJobItem } from '@/components/FailedJobItem';

interface Props {
  jobs: FailedJob[];
}

export function FailedJobsPanel({ jobs }: Props) {
  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-6 py-8 text-center">
        <p className="text-sm text-neutral-400">Aucun job échoué</p>
      </div>
    );
  }

  return (
    <section aria-label="Jobs échoués">
      <h2 className="mb-3 text-sm font-semibold text-neutral-300">
        Jobs échoués ({jobs.length})
      </h2>
      <div className="flex flex-col gap-2" role="list">
        {jobs.slice(0, 50).map((job) => (
          <div key={String(job.id)} role="listitem">
            <FailedJobItem job={job} />
          </div>
        ))}
      </div>
    </section>
  );
}
