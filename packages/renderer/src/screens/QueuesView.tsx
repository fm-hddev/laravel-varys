import { ArrowCounterClockwise, ListBullets, TerminalWindow, WarningCircle } from '@phosphor-icons/react';
import { useState } from 'react';

import { CollapsiblePanel } from '@/components/CollapsiblePanel';
import { LogPanel } from '@/components/LogPanel';
import { StatCard } from '@/components/StatCard';
import { useLogStream } from '@/hooks/useLogStream';
import { useProcessStream } from '@/hooks/useProcessStream';
import { useFailedJobs, useQueueStats } from '@/hooks/useQueueStats';

export default function QueuesView() {
  const { data: stats, isLoading: statsLoading, isError: statsError } = useQueueStats();
  const { data: failedJobs, isLoading: jobsLoading } = useFailedJobs();
  const { data: processes } = useProcessStream();

  const workerProcess = processes?.find((p) =>
    p.name.toLowerCase().includes('queue_worker') || p.name.toLowerCase().includes('queue-worker'),
  );
  const workerLogs = useLogStream(workerProcess?.id ?? '', !!workerProcess);
  const [clearOffset, setClearOffset] = useState(0);
  const visibleLogs = workerLogs.slice(clearOffset);

  const driver = stats?.driver;
  const totalPending = stats?.queues.reduce((a, q) => a + q.pending, 0) ?? 0;
  const totalProcessing = stats?.queues.reduce((a, q) => a + q.processing, 0) ?? 0;
  const totalFailed = stats?.queues.reduce((a, q) => a + q.failed, 0) ?? 0;

  return (
    <main className="flex h-full flex-col overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <div
        className="flex flex-shrink-0 items-center gap-3 px-4 py-3"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <h1 className="text-base font-bold" style={{ color: 'var(--text-1)' }}>
          Queues
        </h1>
        {driver && (
          <span
            className="rounded px-2 py-0.5 text-xs font-medium"
            style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}
          >
            {driver}
          </span>
        )}
        <span className="ml-auto inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: 'var(--hd-green-500, #22C55E)', boxShadow: '0 0 6px var(--hd-green-500, #22C55E)' }}
          />
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>LIVE</span>
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col overflow-hidden gap-3 p-4">
        {/* Error */}
        {statsError && (
          <div
            className="rounded-lg px-4 py-3 text-sm"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
          >
            Queues inaccessibles — vérifiez DB_CONNECTION et l&apos;accessibilité de la base de données.
          </div>
        )}

        {/* Stat cards */}
        {statsLoading && (
          <div className="grid grid-cols-3 gap-3 flex-shrink-0">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg px-3 py-2"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', height: 64 }}
              />
            ))}
          </div>
        )}

        {!statsLoading && !statsError && (
          <div className="grid grid-cols-3 gap-3 flex-shrink-0">
            <StatCard label="En attente" value={totalPending} variant="violet" />
            <StatCard label="En traitement" value={totalProcessing} variant="warning" />
            <StatCard label="Échoués" value={totalFailed} variant="danger" />
          </div>
        )}

        {/* Collapsibles — Jobs + Échecs */}
        {!statsLoading && !statsError && (
          <div className="flex gap-3 flex-shrink-0">
            <CollapsiblePanel
              title="Jobs"
              icon={<ListBullets size={16} />}
              count={totalPending + totalProcessing}
              countVariant="violet"
              defaultOpen={false}
              className="flex-1"
            >
              <table className="w-full text-xs" style={{ color: 'var(--text-2)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-3)' }}>
                    <th className="px-3 py-2 text-left font-medium">Queue</th>
                    <th className="px-3 py-2 text-right font-medium">En attente</th>
                    <th className="px-3 py-2 text-right font-medium">En traitement</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.queues.map((q) => (
                    <tr key={q.name} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-3 py-2 font-mono">{q.name}</td>
                      <td className="px-3 py-2 text-right" style={{ color: 'var(--hd-violet-400)' }}>{q.pending}</td>
                      <td className="px-3 py-2 text-right" style={{ color: 'var(--hd-amber-500, #F59E0B)' }}>{q.processing}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CollapsiblePanel>

            <CollapsiblePanel
              title="Échecs"
              icon={<WarningCircle size={16} />}
              count={failedJobs?.length ?? 0}
              countVariant="danger"
              defaultOpen={false}
              className="flex-1"
            >
              {jobsLoading ? (
                <div className="px-3 py-2 text-xs" style={{ color: 'var(--text-3)' }}>Chargement…</div>
              ) : (
                <table className="w-full text-xs" style={{ color: 'var(--text-2)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-3)' }}>
                      <th className="px-3 py-2 text-left font-medium">Queue</th>
                      <th className="px-3 py-2 text-left font-medium">Classe</th>
                      <th className="px-3 py-2 text-left font-medium">Échoué à</th>
                      <th className="px-3 py-2 text-left font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {failedJobs?.map((job) => (
                      <tr key={job.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="px-3 py-2 font-mono">{job.queue}</td>
                        <td className="px-3 py-2 font-mono truncate max-w-[120px]">{job.exception.split('\n')[0] ?? String(job.id)}</td>
                        <td className="px-3 py-2" style={{ color: 'var(--text-3)' }}>
                          {new Date(job.failedAt).toLocaleString('fr-FR')}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            aria-label="Relancer ce job"
                            className="rounded p-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                            style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-3)' }}
                          >
                            <ArrowCounterClockwise size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CollapsiblePanel>
          </div>
        )}

        {/* Worker logs — dominant */}
        <div className="flex flex-1 flex-col overflow-hidden gap-2">
          <div className="flex items-center justify-between flex-shrink-0">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--text-3)' }}>
              <TerminalWindow size={15} />
              Logs worker — {workerProcess?.name ?? 'queue:work'}
            </span>
            <div className="flex items-center gap-2">
              {workerProcess ? (
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: 'var(--hd-green-500, #22C55E)', boxShadow: '0 0 6px var(--hd-green-500, #22C55E)' }}
                  />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Actif</span>
                </span>
              ) : (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Aucun worker</span>
              )}
              <button
                type="button"
                onClick={() => setClearOffset(workerLogs.length)}
                className="rounded px-2 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                style={{ background: 'var(--bg-card)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
              >
                Vider
              </button>
            </div>
          </div>
          {workerProcess ? (
            <LogPanel lines={visibleLogs} className="flex-1" />
          ) : (
            <div
              className="flex flex-1 items-center justify-center rounded-lg font-mono text-xs"
              style={{ background: 'var(--log-bg)', border: '1px solid var(--log-border)', color: 'var(--log-ts)' }}
            >
              Aucun worker détecté
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
