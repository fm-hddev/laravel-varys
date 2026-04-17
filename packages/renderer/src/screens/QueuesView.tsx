import { FailedJobsPanel } from '@/components/FailedJobsPanel';
import { QueueStatCard } from '@/components/QueueStatCard';
import { useFailedJobs, useQueueStats } from '@/hooks/useQueueStats';

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="mb-3 h-4 w-24 rounded bg-neutral-800" />
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-lg bg-neutral-800 px-2 py-2">
            <div className="mx-auto h-3 w-12 rounded bg-neutral-700" />
            <div className="mx-auto mt-1 h-6 w-8 rounded bg-neutral-700" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function QueuesView() {
  const { data: stats, isLoading: statsLoading, isError: statsError } = useQueueStats();
  const { data: failedJobs, isLoading: jobsLoading } = useFailedJobs();

  const driver = stats?.driver;

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-8">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-neutral-100">Queues</h1>
          {driver && (
            <span className="rounded bg-neutral-800 px-2 py-0.5 text-xs font-medium text-neutral-400">
              {driver}
            </span>
          )}
        </div>

        {/* Queue stats */}
        {statsError && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-6 py-12 text-center">
            <p className="text-sm font-medium text-neutral-300">Queues inaccessibles</p>
            <p className="mt-1 text-xs text-neutral-500">
              Vérifiez DB_CONNECTION et l'accessibilité de la base de données.
            </p>
          </div>
        )}

        {statsLoading && (
          <div className="grid gap-4 sm:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {stats && stats.queues.length === 0 && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-6 py-12 text-center">
            <p className="text-sm font-medium text-neutral-300">Aucune queue détectée</p>
            <p className="mt-1 text-xs text-neutral-500">
              Vérifiez DB_CONNECTION et l'accessibilité de la base de données.
            </p>
          </div>
        )}

        {stats && stats.queues.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {stats.queues.map((q) => (
              <QueueStatCard key={q.name} queue={q} />
            ))}
          </div>
        )}

        {/* Failed jobs */}
        {!jobsLoading && failedJobs !== undefined && (
          <FailedJobsPanel jobs={failedJobs} />
        )}
      </div>
    </main>
  );
}
