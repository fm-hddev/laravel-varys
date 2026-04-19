import {
  ArrowCounterClockwise,
  CaretDown,
  ListBullets,
  TerminalWindow,
  Trash,
  WarningCircle,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { CollapsiblePanel } from '@/components/CollapsiblePanel';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { LogPanel } from '@/components/LogPanel';
import { StatCard } from '@/components/StatCard';
import { useLogStream } from '@/hooks/useLogStream';
import { useProcessStream } from '@/hooks/useProcessStream';
import { useFailedJobs, useForgetFailedJob, usePurgeAllFailedJobs, useQueueStats, useRetryFailedJob } from '@/hooks/useQueueStats';

type ErrorType = { label: string; color: string };

function errorTypeBadge(exception: string): ErrorType {
  const first = exception.split('\n')[0] ?? '';
  if (/connection/i.test(first)) return { label: 'Connection', color: '#3B82F6' };
  if (/auth|credential/i.test(first)) return { label: 'Auth', color: '#F59E0B' };
  if (/timeout/i.test(first)) return { label: 'Timeout', color: '#8B5CF6' };
  return { label: 'Exception', color: 'var(--hd-danger-500)' };
}

type ConfirmState =
  | { type: 'purge' }
  | { type: 'forget'; id: string | number; name: string }
  | null;

export default function QueuesView() {
  const { data: stats, isLoading: statsLoading, isError: statsError } = useQueueStats();
  const { data: failedJobs, isLoading: jobsLoading } = useFailedJobs();
  const { data: processes } = useProcessStream();
  const navigate = useNavigate();

  const retryJob  = useRetryFailedJob();
  const forgetJob = useForgetFailedJob();
  const purgeAll  = usePurgeAllFailedJobs();

  const [echecsOpen, setEchecsOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);

  const workerProcess = processes?.find((p) =>
    p.name.toLowerCase().includes('queue_worker') || p.name.toLowerCase().includes('queue-worker'),
  );
  const workerLogs = useLogStream(workerProcess?.id ?? '', !!workerProcess);
  const [clearOffset, setClearOffset] = useState(0);
  const visibleLogs = workerLogs.slice(clearOffset);

  const driver = stats?.driver;
  const totalPending    = stats?.queues.reduce((a, q) => a + q.pending, 0) ?? 0;
  const totalProcessing = stats?.queues.reduce((a, q) => a + q.processing, 0) ?? 0;
  const totalFailed     = stats?.queues.reduce((a, q) => a + q.failed, 0) ?? 0;
  const failedCount     = failedJobs?.length ?? 0;

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
        {statsError && (
          <div
            className="rounded-lg px-4 py-3 text-sm"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
          >
            Queues inaccessibles — vérifiez DB_CONNECTION et l&apos;accessibilité de la base de données.
          </div>
        )}

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
            <StatCard label="En attente"    value={totalPending}    variant="violet"  />
            <StatCard label="En traitement" value={totalProcessing} variant="warning" />
            <StatCard label="Échoués"       value={totalFailed}     variant="danger"  />
          </div>
        )}

        {/* Collapsibles */}
        {!statsLoading && !statsError && (
          <div className="flex gap-3 flex-shrink-0">
            {/* Jobs panel */}
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

            {/* Échecs panel — header manuel pour accueillir les boutons d'action */}
            <div
              className="flex-1 overflow-hidden"
              style={{ border: '1px solid var(--border)', borderRadius: 'var(--hd-radius-xl, 12px)' }}
            >
              <div
                className="flex w-full items-center gap-2 p-3"
                style={{ background: 'var(--bg-card)', cursor: 'pointer' }}
                onClick={() => setEchecsOpen((o) => !o)}
              >
                <WarningCircle size={16} style={{ color: 'var(--hd-danger-500)' }} />
                <span className="flex-1 text-left text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                  Échecs
                </span>
                {failedCount > 0 && (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-xs font-bold"
                    style={{ background: 'var(--log-error, #EF4444)', color: '#fff' }}
                  >
                    {failedCount}
                  </span>
                )}
                {/* Actions — ne pas propager le click vers le toggle */}
                <div
                  className="flex items-center gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => { failedJobs?.forEach((j) => { retryJob.mutate(j.id); }); }}
                    className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
                  >
                    <ArrowCounterClockwise size={11} />
                    Retry all
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmState({ type: 'purge' })}
                    className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors"
                    style={{ color: 'var(--hd-danger-500)', border: '1px solid rgba(239,68,68,0.2)', background: 'transparent' }}
                  >
                    <Trash size={11} />
                    Purger de la DB
                  </button>
                </div>
                <CaretDown
                  size={14}
                  style={{
                    transition: 'transform 200ms',
                    transform: echecsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    color: 'var(--text-3)',
                  }}
                />
              </div>

              {echecsOpen && (
                <div>
                  {jobsLoading ? (
                    <div className="px-3 py-2 text-xs" style={{ color: 'var(--text-3)' }}>Chargement…</div>
                  ) : failedCount === 0 ? (
                    <div className="px-3 py-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                      Aucun job échoué
                    </div>
                  ) : (
                    <>
                      <table className="w-full text-xs" style={{ color: 'var(--text-2)' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-3)' }}>
                            <th className="px-3 py-2 text-left font-medium">Classe & Erreur</th>
                            <th className="px-3 py-2 text-left font-medium">Type</th>
                            <th className="px-3 py-2 text-left font-medium">Queue</th>
                            <th className="px-3 py-2 text-right font-medium">Essais</th>
                            <th className="px-3 py-2 text-left font-medium">Échoué le</th>
                            <th className="px-3 py-2 text-left font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {failedJobs?.map((job) => {
                            const badge      = errorTypeBadge(job.exception);
                            const payload    = job.payload as Record<string, unknown>;
                            const displayName = String(payload?.['displayName'] ?? job.id);
                            const maxTries   = payload?.['maxTries'] != null ? String(payload['maxTries']) : '?';
                            const errorSnippet = (job.exception.split('\n')[0] ?? '').slice(0, 80);

                            return (
                              <tr
                                key={job.id}
                                style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                                onClick={() => { void navigate('/queues/failed', { state: { job } }); }}
                                title="Voir le détail"
                              >
                                <td className="px-3 py-2" style={{ maxWidth: 200 }}>
                                  <div className="font-mono font-semibold truncate" style={{ fontSize: 11.5, color: 'var(--text-1)' }}>
                                    {displayName}
                                  </div>
                                  <div className="truncate" style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 1 }}>
                                    {errorSnippet}
                                  </div>
                                </td>
                                <td className="px-3 py-2">
                                  <span
                                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                                    style={{ background: `${badge.color}22`, color: badge.color, border: `1px solid ${badge.color}44` }}
                                  >
                                    {badge.label}
                                  </span>
                                </td>
                                <td className="px-3 py-2 font-mono">{job.queue}</td>
                                <td className="px-3 py-2 text-right font-mono" style={{ color: 'var(--hd-danger-500)' }}>
                                  {maxTries} / {maxTries}
                                </td>
                                <td className="px-3 py-2" style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                  {new Date(job.failedAt).toLocaleString('fr-FR')}
                                </td>
                                <td className="px-3 py-2">
                                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      aria-label="Relancer ce job"
                                      onClick={() => retryJob.mutate(job.id)}
                                      className="flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors"
                                      style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-3)' }}
                                    >
                                      <ArrowCounterClockwise size={11} />
                                      Retry
                                    </button>
                                    <button
                                      type="button"
                                      aria-label="Supprimer ce job de la DB"
                                      onClick={() => setConfirmState({ type: 'forget', id: job.id, name: displayName })}
                                      className="flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors"
                                      style={{ color: 'var(--hd-danger-500)', border: '1px solid rgba(239,68,68,0.2)', background: 'transparent' }}
                                    >
                                      <Trash size={11} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <div
                        className="flex items-center gap-1.5 px-3 py-2 text-xs"
                        style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}
                      >
                        Cliquez sur une ligne pour voir le détail, la stack trace et le payload.
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Worker logs */}
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

      {/* Confirmation dialog */}
      <ConfirmDialog
        open={confirmState !== null}
        title={confirmState?.type === 'purge' ? 'Purger tous les échecs ?' : 'Supprimer ce job ?'}
        message={
          confirmState?.type === 'purge'
            ? 'Supprime définitivement tous les jobs de la table failed_jobs. Cette action est irréversible.'
            : `Le job « ${confirmState?.type === 'forget' ? confirmState.name : ''} » sera supprimé de failed_jobs. Cette action est irréversible.`
        }
        onCancel={() => setConfirmState(null)}
        onConfirm={() => {
          if (confirmState?.type === 'purge') purgeAll.mutate();
          if (confirmState?.type === 'forget') forgetJob.mutate(confirmState.id);
          setConfirmState(null);
        }}
      />
    </main>
  );
}
