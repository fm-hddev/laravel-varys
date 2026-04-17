import type { HealthReport as HealthReportType } from '@varys/core';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AdapterConfig } from '@/components/AdapterConfig';
import { HealthReport } from '@/components/HealthReport';
import { KnownProjectsList } from '@/components/KnownProjectsList';
import { useIpc } from '@/hooks/useIpc';
import { useProjectStore } from '@/store/useProjectStore';

export default function SettingsScreen() {
  const ipc = useIpc();
  const navigate = useNavigate();
  const { activePath, setActivePath, knownPaths, setKnownPaths } = useProjectStore();

  const [report, setReport] = useState<HealthReportType | null>(null);

  useEffect(() => {
    void (async () => {
      const [paths, health] = await Promise.all([ipc.listKnownPaths(), ipc.getHealth()]);
      setKnownPaths(paths);
      setReport(health);
    })();
  }, [activePath]); // ipc est stable (ref constante)

  async function handleSwitch(path: string): Promise<void> {
    await ipc.setActivePath(path);
    setActivePath(path);
    const [paths, health] = await Promise.all([ipc.listKnownPaths(), ipc.getHealth()]);
    setKnownPaths(paths);
    setReport(health);
  }

  async function handleRemove(path: string): Promise<void> {
    await ipc.removeKnownPath(path);
    const paths = await ipc.listKnownPaths();
    setKnownPaths(paths);
  }

  async function handleAdapterToggle(adapterId: string, enabled: boolean): Promise<void> {
    await ipc.updateAdapterConfig(adapterId, enabled);
    const health = await ipc.getHealth();
    setReport(health);
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-xl font-bold text-neutral-100">Paramètres</h1>
          <button
            type="button"
            onClick={() => { void navigate(-1); }}
            aria-label="Retour"
            className="text-sm text-neutral-400 hover:text-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            ← Retour
          </button>
        </div>

        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Projet actif
          </h2>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2">
            <p className="truncate text-sm text-neutral-100" title={activePath ?? undefined}>
              {activePath ?? <span className="text-neutral-500">Aucun projet sélectionné</span>}
            </p>
            <button
              type="button"
              onClick={() => { void navigate('/welcome'); }}
              aria-label="Changer de projet"
              className="shrink-0 rounded px-2 py-1 text-xs font-medium text-indigo-400 hover:bg-indigo-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              Changer
            </button>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Projets connus
          </h2>
          <KnownProjectsList
            paths={knownPaths}
            activePath={activePath}
            onSwitch={(path) => { void handleSwitch(path); }}
            onRemove={(path) => { void handleRemove(path); }}
          />
        </section>

        {report && (
          <>
            <section className="mb-8">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">
                Configuration des adapters
              </h2>
              <AdapterConfig
                report={report}
                onToggle={(id, enabled) => { void handleAdapterToggle(id, enabled); }}
              />
            </section>

            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">
                État des adapters
              </h2>
              <HealthReport report={report} />
            </section>
          </>
        )}
      </div>
    </main>
  );
}
