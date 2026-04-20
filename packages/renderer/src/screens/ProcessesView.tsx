import { ProcessCard } from '@/components/ProcessCard';
import { useProcessStream } from '@/hooks/useProcessStream';

export default function ProcessesView() {
  const { data: processes, isLoading } = useProcessStream();

  const online = processes?.filter((p) => p.status === 'up').length ?? 0;
  const offline = processes?.filter((p) => p.status !== 'up').length ?? 0;

  return (
    <div className="flex h-full flex-col" style={{ background: 'var(--bg-base)' }}>

      {/* Page header */}
      <div
        className="flex shrink-0 items-center gap-3 px-6 py-4"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}
      >
        <h1
          className="text-[17px] font-bold"
          style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}
        >
          Processus
        </h1>
        {processes && online > 0 && (
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{
              background: 'rgba(16,185,129,0.12)',
              color: 'var(--hd-emerald-400)',
              border: '1px solid rgba(16,185,129,0.25)',
            }}
          >
            {online} en ligne
          </span>
        )}
        {processes && offline > 0 && (
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{
              background: 'rgba(239,68,68,0.12)',
              color: 'var(--hd-danger-500)',
              border: '1px solid rgba(239,68,68,0.25)',
            }}
          >
            {offline} hors ligne
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">

        {isLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl"
                style={{ height: 96, border: '1px solid var(--border)', background: 'var(--bg-card)' }}
              />
            ))}
          </div>
        )}

        {!isLoading && (!processes || processes.length === 0) && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>
              Aucun processus détecté
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              Assurez-vous que Docker ou des processus Artisan sont en cours d'exécution.
            </p>
          </div>
        )}

        {processes && processes.length > 0 && (
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}
            aria-label="Liste des processus"
          >
            {processes.map((proc) => (
              <ProcessCard key={proc.id} process={proc} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
