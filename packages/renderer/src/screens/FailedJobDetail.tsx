import { ArrowCounterClockwise, ArrowLeft, CaretDown, Trash } from '@phosphor-icons/react';
import type { FailedJob } from '@varys/core';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useForgetFailedJob, useRetryFailedJob } from '@/hooks/useQueueStats';

function firstLine(text: string): string {
  return text.split('\n')[0] ?? text;
}

export default function FailedJobDetail() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const state     = location.state as { job?: FailedJob } | null;
  const job       = state?.job;

  const retryJob  = useRetryFailedJob();
  const forgetJob = useForgetFailedJob();

  const [stackOpen,   setStackOpen]   = useState(true);
  const [payloadOpen, setPayloadOpen] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!job) {
    return (
      <main className="flex h-full flex-col items-center justify-center gap-3" style={{ background: 'var(--bg-base)' }}>
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Job introuvable.</span>
        <button
          type="button"
          onClick={() => { void navigate('/queues'); }}
          className="rounded px-3 py-1.5 text-xs font-medium"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer' }}
        >
          ← Retour aux queues
        </button>
      </main>
    );
  }

  const payload     = job.payload as Record<string, unknown>;
  const displayName = String(payload?.['displayName'] ?? job.id);
  const maxTries    = payload?.['maxTries'] != null ? String(payload['maxTries']) : '?';
  const exceptionClass   = firstLine(job.exception).split(':')[0]?.trim() ?? '';
  const exceptionMessage = firstLine(job.exception).split(':').slice(1).join(':').trim();
  const stackTrace  = job.exception;

  return (
    <main className="flex h-full flex-col overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <div
        className="flex flex-shrink-0 items-center gap-3 px-4 py-3"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}
      >
        <button
          type="button"
          onClick={() => { void navigate('/queues'); }}
          className="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-colors"
          style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-3)', cursor: 'pointer' }}
        >
          <ArrowLeft size={13} />
          Retour
        </button>
        <div className="flex-1 min-w-0">
          <div className="truncate text-sm font-bold" style={{ color: 'var(--text-1)' }}>{displayName}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Failed Job Detail</div>
        </div>
        <button
          type="button"
          onClick={() => { retryJob.mutate(job.id); }}
          className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer' }}
        >
          <ArrowCounterClockwise size={13} />
          Retry
        </button>
        <button
          type="button"
          onClick={() => { setShowConfirm(true); }}
          className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: 'var(--hd-danger-500)', cursor: 'pointer' }}
        >
          <Trash size={13} />
          Supprimer de la DB
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">

        {/* Exception card */}
        <div
          className="rounded-xl p-4"
          style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <div className="font-mono text-sm font-bold" style={{ color: 'var(--hd-danger-400, #F87171)' }}>
            {exceptionClass}
          </div>
          {exceptionMessage && (
            <div className="mt-1 text-sm" style={{ color: 'var(--text-2)', lineHeight: 1.5 }}>
              {exceptionMessage}
            </div>
          )}
        </div>

        {/* Metadata row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { label: 'Queue',    value: job.queue },
            { label: 'Essais',   value: `${maxTries} / ${maxTries}` },
            { label: 'Échoué le', value: new Date(job.failedAt).toLocaleString('fr-FR') },
            { label: 'Statut',   value: 'Failed definitively' },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-lg p-3"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div className="text-xs font-medium" style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
              <div className="text-xs font-semibold font-mono" style={{ color: 'var(--text-1)' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Stack trace */}
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <button
            type="button"
            onClick={() => setStackOpen((o) => !o)}
            className="flex w-full items-center gap-2 px-4 py-3 text-xs font-semibold"
            style={{ background: 'var(--bg-card)', color: 'var(--text-2)', cursor: 'pointer', border: 'none' }}
          >
            <span className="flex-1 text-left">Stack trace</span>
            <CaretDown
              size={13}
              style={{ transition: 'transform 200ms', transform: stackOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: 'var(--text-muted)' }}
            />
          </button>
          {stackOpen && (
            <pre
              className="overflow-x-auto p-4 text-xs"
              style={{ background: 'var(--log-bg)', color: 'var(--hd-danger-300, #FCA5A5)', lineHeight: 1.7, margin: 0 }}
            >
              {stackTrace}
            </pre>
          )}
        </div>

        {/* Payload */}
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <button
            type="button"
            onClick={() => setPayloadOpen((o) => !o)}
            className="flex w-full items-center gap-2 px-4 py-3 text-xs font-semibold"
            style={{ background: 'var(--bg-card)', color: 'var(--text-2)', cursor: 'pointer', border: 'none' }}
          >
            <span className="flex-1 text-left">Payload du job</span>
            <CaretDown
              size={13}
              style={{ transition: 'transform 200ms', transform: payloadOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: 'var(--text-muted)' }}
            />
          </button>
          {payloadOpen && (
            <pre
              className="overflow-x-auto p-4 text-xs"
              style={{ background: 'var(--log-bg)', color: 'var(--hd-violet-300)', lineHeight: 1.7, margin: 0 }}
            >
              {JSON.stringify(job.payload, null, 2)}
            </pre>
          )}
        </div>
      </div>

      {/* Confirmation dialog */}
      <ConfirmDialog
        open={showConfirm}
        title="Supprimer ce job ?"
        message={`Le job « ${displayName} » sera supprimé définitivement de failed_jobs. Cette action est irréversible.`}
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => {
          forgetJob.mutate(job.id, { onSuccess: () => { void navigate('/queues'); } });
          setShowConfirm(false);
        }}
      />
    </main>
  );
}
