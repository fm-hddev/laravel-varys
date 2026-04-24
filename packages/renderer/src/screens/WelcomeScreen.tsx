import { ArrowRight } from '@phosphor-icons/react';
import type { HealthReport as HealthReportType, KnownPath } from '@varys/core';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { HealthReport } from '@/components/HealthReport';
import { useIpc } from '@/hooks/useIpc';
import { useProjectStore } from '@/store/useProjectStore';

type Step = 'idle' | 'validating' | 'done';

function basename(path: string): string {
  return path.split('/').pop() ?? path;
}

export default function WelcomeScreen() {
  const ipc = useIpc();
  const navigate = useNavigate();
  const { activePath, setActivePath, knownPaths, setKnownPaths } = useProjectStore();

  const [step, setStep] = useState<Step>('idle');
  const [report, setReport] = useState<HealthReportType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const hasAvailableAdapter = report?.adapters.some((a) => a.result.available) ?? false;

  useEffect(() => {
    void (async () => {
      const [paths, active] = await Promise.all([
        ipc.listKnownPaths(),
        ipc.getActivePath(),
      ]);
      setKnownPaths(paths);
      if (active !== null) setActivePath(active);
      setLoading(false);
    })();
  }, []);

  async function handleOpenKnown(path: string): Promise<void> {
    setError(null);
    setStep('validating');
    try {
      await ipc.setActivePath(path);
      setActivePath(path);
      const health = await ipc.getHealth();
      setReport(health);
      setStep('done');
      if (health.adapters.some((a) => a.result.available)) {
        void navigate('/processes');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setStep('idle');
    }
  }

  async function handleSelectProject(): Promise<void> {
    setError(null);
    try {
      const path = await ipc.openDialog();
      if (!path) return;

      setStep('validating');
      await ipc.setActivePath(path);
      setActivePath(path);

      const health = await ipc.getHealth();
      const paths = await ipc.listKnownPaths();
      setKnownPaths(paths);
      setReport(health);
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setStep('idle');
    }
  }

  function handleContinue() {
    void navigate('/processes');
  }

  const headerTitle = (
    <header className="mb-8 text-center">
      <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-1)' }}>Varys</h1>
    </header>
  );

  const headerEmpty = (
    <header className="mb-8 text-center">
      <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-1)' }}>Varys</h1>
      <p className="mt-2 text-sm italic" style={{ color: 'var(--text-3)' }}>
        "I have little birds everywhere, even in the North."
      </p>
    </header>
  );

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12" style={{ background: 'var(--bg-base)' }}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Chargement…</p>
      </main>
    );
  }

  // État A — projets connus
  if (knownPaths.length > 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12" style={{ background: 'var(--bg-base)' }}>
        <div className="w-full max-w-md">
          {headerTitle}

          <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Projets récents
          </p>

          <div className="rounded-xl overflow-hidden mb-4" style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
            {knownPaths.map((kp: KnownPath, idx) => {
              const isActive = kp.projectPath === activePath;
              return (
                <div
                  key={kp.projectPath}
                  className="flex items-center gap-3 px-4 py-3"
                  style={idx > 0 ? { borderTop: '1px solid var(--border)' } : undefined}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-1)' }}>
                        {kp.label || basename(kp.projectPath)}
                      </span>
                      {isActive && (
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
                          style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}
                        >
                          Actif
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs font-mono" style={{ color: 'var(--text-muted)' }} title={kp.projectPath}>
                      {kp.projectPath}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={step === 'validating'}
                    onClick={() => { void handleOpenKnown(kp.projectPath); }}
                    className="shrink-0 flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ background: isActive ? 'var(--hd-violet-600)' : 'var(--bg-card)', color: isActive ? '#fff' : 'var(--text-2)', border: isActive ? 'none' : '1px solid var(--border)' }}
                  >
                    <ArrowRight size={13} />
                    {step === 'validating' ? '…' : 'Ouvrir'}
                  </button>
                </div>
              );
            })}
          </div>

          {error && (
            <p role="alert" className="mb-3 text-center text-sm text-red-400">{error}</p>
          )}

          {report && step === 'done' && (
            <div className="mb-4">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                État des adapters
              </h2>
              <HealthReport report={report} />
              {!hasAvailableAdapter && (
                <button
                  type="button"
                  onClick={handleContinue}
                  className="mt-3 w-full rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  Continuer quand même
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => { void handleSelectProject(); }}
            disabled={step === 'validating'}
            className="w-full rounded-lg px-5 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ border: '1px dashed var(--border)', background: 'transparent', color: 'var(--text-3)' }}
          >
            + Autre projet…
          </button>
        </div>
      </main>
    );
  }

  // État B — premier lancement
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12" style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-md">
        {headerEmpty}

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

          {error && (
            <p role="alert" className="text-center text-sm text-red-400">{error}</p>
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
