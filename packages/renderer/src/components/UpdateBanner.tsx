import { ArrowCircleUp, X } from '@phosphor-icons/react';

import { useUpdateCheck } from '@/hooks/useUpdateCheck';

export function UpdateBanner() {
  const { updateInfo, dismiss, openRelease } = useUpdateCheck();

  if (!updateInfo?.available) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-between gap-3 px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-900 text-sm"
    >
      <div className="flex items-center gap-2">
        <ArrowCircleUp className="size-4 shrink-0" aria-hidden="true" />
        <span>
          Varys <strong>{updateInfo.latestVersion}</strong> est disponible.{' '}
          <button
            onClick={openRelease}
            className="underline underline-offset-2 hover:text-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
          >
            Voir les notes de version
          </button>
        </span>
      </div>
      <button
        onClick={dismiss}
        aria-label="Fermer la notification de mise à jour"
        className="shrink-0 rounded hover:text-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
