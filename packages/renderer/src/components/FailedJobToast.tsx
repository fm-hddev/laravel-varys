/**
 * FailedJobToast — toast permanent pour les jobs échoués
 *
 * Non auto-dismiss (duration: Infinity). Actions : Retry + Dismiss.
 * Détecte les nouveaux jobs par comparaison avec le poll précédent (React Query).
 *
 * Monter dans App.tsx :
 *   useFailedJobToasts();
 *   <Toaster position="bottom-right" richColors />
 */

import { ArrowCounterClockwise, Warning, X } from '@phosphor-icons/react';
import type { FailedJob } from '@varys/core';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { useFailedJobs, useRetryFailedJob } from '@/hooks/useQueueStats';

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Écoute le poll React Query des failed jobs et affiche un toast permanent
 * pour chaque nouveau job détecté depuis le dernier poll.
 */
export function useFailedJobToasts() {
  const { data: failedJobs } = useFailedJobs();
  const retryMutation = useRetryFailedJob();
  const prevIdsRef = useRef<Set<string | number>>(new Set());

  useEffect(() => {
    if (!failedJobs) return;

    const newJobs = failedJobs.filter(job => !prevIdsRef.current.has(job.id));

    newJobs.forEach(job => {
      toast.custom(
        (toastId) => (
          <FailedJobToastContent
            job={job}
            onRetry={async () => {
              await retryMutation.mutateAsync(job.id);
              toast.dismiss(toastId);
            }}
            onDismiss={() => toast.dismiss(toastId)}
          />
        ),
        {
          id:       `failed-job-${job.id}`,
          duration: Infinity,
          position: 'bottom-right',
        },
      );
    });

    prevIdsRef.current = new Set(failedJobs.map(j => j.id));
  }, [failedJobs, retryMutation]);
}

// ─── Toast UI ─────────────────────────────────────────────────────────────────

interface FailedJobToastContentProps {
  job:       FailedJob;
  onRetry:   () => Promise<void>;
  onDismiss: () => void;
}

function FailedJobToastContent({ job, onRetry, onDismiss }: FailedJobToastContentProps) {
  return (
    <div className="
      flex items-start gap-3 w-80
      rounded-lg border border-destructive/40 bg-background
      px-4 py-3 shadow-lg
    ">
      <Warning className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" weight="fill" />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-tight">
          Job failed
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
          {job.queue}
        </p>
        <p
          className="text-xs text-destructive/80 mt-1 line-clamp-2"
          title={job.exception}
        >
          {job.exception}
        </p>

        <div className="flex items-center gap-2 mt-2.5">
          <button
            onClick={() => { void onRetry(); }}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowCounterClockwise className="h-3 w-3" />
            Retry
          </button>
          <span className="text-border">·</span>
          <button
            onClick={onDismiss}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>

      <button
        onClick={onDismiss}
        className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}