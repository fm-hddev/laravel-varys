import type { HealthReport as HealthReportType } from '@varys/core';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { HealthReport } from '@/components/HealthReport';
import { useIpc } from '@/hooks/useIpc';
import { useProjectStore } from '@/store/useProjectStore';

type Step = 'idle' | 'validating' | 'done';

export default function WelcomeScreen() {
  const ipc = useIpc();
  const navigate = useNavigate();
  const setActivePath = useProjectStore((s) => s.setActivePath);

  const [step, setStep] = useState<Step>('idle');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [report, setReport] = useState<HealthReportType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasAvailableAdapter = report?.adapters.some((a) => a.result.available) ?? false;

  async function handleSelectProject(): Promise<void> {
    setError(null);
    try {
      const path = await ipc.openDialog();
      if (!path) return;

      setSelectedPath(path);
      setStep('validating');

      await ipc.setActivePath(path);
      setActivePath(path);

      const healthReport = await ipc.getHealth();
      setReport(healthReport);
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setStep('idle');
    }
  }

  function handleContinue() {
    void navigate('/processes');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12" style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-md">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-1)' }}>Varys</h1>
          <p className="mt-2 text-sm italic" style={{ color: 'var(--text-3)' }}>
            "I have little birds everywhere, even in the North."
          </p>
        </header>

        <section className="flex flex-col gap-6">
          <button
            type="button"
            onClick={() => { void handleSelectProject(); }}
            disabled={step === 'validating'}
            aria-label="Sélectionner un projet Laravel"
            className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {step === 'validating' ? 'Validation en cours…' : 'Sélectionner un projet Laravel'}
          </button>

          {selectedPath && (
            <p className="truncate text-center text-xs" style={{ color: 'var(--text-muted)' }} title={selectedPath}>
              {selectedPath}
            </p>
          )}

          {error && (
            <p role="alert" className="text-center text-sm text-red-400">
              {error}
            </p>
          )}

          {report && (
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                État des adapters
              </h2>
              <HealthReport report={report} />
            </div>
          )}

          {step === 'done' && (
            <button
              type="button"
              onClick={handleContinue}
              disabled={!hasAvailableAdapter}
              aria-label="Continuer vers le tableau de bord"
              className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continuer
            </button>
          )}
        </section>
      </div>
    </main>
  );
}
