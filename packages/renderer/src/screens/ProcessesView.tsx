import { ProcessCard } from '@/components/ProcessCard';
import { useProcessStream } from '@/hooks/useProcessStream';

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl p-4" style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded" style={{ background: 'var(--border)' }} />
          <div className="h-3 w-48 rounded" style={{ background: 'var(--border)' }} />
        </div>
      </div>
    </div>
  );
}

export default function ProcessesView() {
  const { data: processes, isLoading } = useProcessStream();

  return (
    <main className="min-h-screen px-6 py-10" style={{ background: 'var(--bg-base)' }}>
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>Processus</h1>
        </div>

        {isLoading && (
          <div className="flex flex-col gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {!isLoading && (!processes || processes.length === 0) && (
          <div className="rounded-xl px-6 py-12 text-center" style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>
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
