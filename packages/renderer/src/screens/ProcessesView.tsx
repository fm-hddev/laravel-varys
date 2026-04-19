import { ProcessCard } from '@/components/ProcessCard';
import { useProcessStream } from '@/hooks/useProcessStream';

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded bg-neutral-800" />
          <div className="h-3 w-48 rounded bg-neutral-800" />
        </div>
      </div>
    </div>
  );
}

export default function ProcessesView() {
  const { data: processes, isLoading } = useProcessStream();

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-neutral-100">Processus</h1>
        </div>

        {isLoading && (
          <div className="flex flex-col gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {!isLoading && (!processes || processes.length === 0) && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-6 py-12 text-center">
            <p className="text-sm text-neutral-400">
              Aucun processus détecté — assurez-vous que Docker ou des processus Artisan sont en cours d'exécution.
            </p>
          </div>
        )}

        {processes && processes.length > 0 && (
          <div className="flex flex-col gap-4">
            {processes.map((proc) => (
              <ProcessCard key={proc.id} process={proc} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
