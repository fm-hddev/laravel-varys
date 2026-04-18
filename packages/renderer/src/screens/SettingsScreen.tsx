import { Desktop, Moon, Sun } from '@phosphor-icons/react';
import type { HealthReport as HealthReportType } from '@varys/core';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AdapterConfig } from '@/components/AdapterConfig';
import { HealthReport } from '@/components/HealthReport';
import { KnownProjectsList } from '@/components/KnownProjectsList';
import { useTheme, type ThemeMode } from '@/components/ThemeProvider';
import { useIpc } from '@/hooks/useIpc';
import { useProjectStore } from '@/store/useProjectStore';

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Clair', icon: <Sun size={16} /> },
  { value: 'dark', label: 'Sombre', icon: <Moon size={16} /> },
  { value: 'system', label: 'Système', icon: <Desktop size={16} /> },
];

export default function SettingsScreen() {
  const ipc = useIpc();
  const navigate = useNavigate();
  const { mode, setMode } = useTheme();
  const { activePath, setActivePath, knownPaths, setKnownPaths } = useProjectStore();

  const [report, setReport] = useState<HealthReportType | null>(null);

  type EnvDefaults = { dbHost: string; dbPort: number; redisHost: string; redisPort: number; reverbHost: string; reverbPort: number; appUrl: string };
  type Overrides = Partial<{ dbHost: string; dbPort: number; redisHost: string; redisPort: number; reverbHost: string; reverbPort: number; appUrl: string }>;

  const [envDefaults, setEnvDefaults] = useState<EnvDefaults | null>(null);
  const [overrides, setOverrides] = useState<Overrides>({});
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void (async () => {
      const [paths, health, ovr] = await Promise.all([
        ipc.listKnownPaths(),
        ipc.getHealth(),
        ipc.getOverrides() as Promise<{ overrides: Overrides; envDefaults: EnvDefaults }>,
      ]);
      setKnownPaths(paths);
      setReport(health);
      setEnvDefaults(ovr.envDefaults);
      setOverrides(ovr.overrides);
    })();
  }, [activePath]); // ipc est stable (ref constante)

  function handleOverrideChange(field: keyof Overrides, raw: string) {
    const isPort = field === 'dbPort' || field === 'redisPort' || field === 'reverbPort';
    const value = raw === '' ? undefined : isPort ? parseInt(raw, 10) : raw;
    const next = { ...overrides, [field]: value };
    // Remove undefined keys
    for (const k of Object.keys(next) as (keyof Overrides)[]) {
      if (next[k] === undefined) delete next[k];
    }
    setOverrides(next);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      void ipc.setOverrides(next);
    }, 600);
  }

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
            Apparence
          </h2>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900">
            <div className="flex items-center justify-between gap-3 px-3 py-2">
              <span className="text-sm text-neutral-300">Thème</span>
              <div className="flex gap-2">
                {THEME_OPTIONS.map(({ value, label, icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMode(value)}
                    aria-pressed={mode === value}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                    style={{
                      border: mode === value ? '2px solid var(--hd-violet-500)' : '2px solid var(--border)',
                      color: mode === value ? 'var(--hd-violet-400)' : 'var(--text-3)',
                      background: 'var(--bg-base)',
                    }}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

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

        {envDefaults && (
          <section className="mb-8">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Connexions
            </h2>
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 divide-y divide-neutral-800">
              {(
                [
                  { field: 'dbHost', label: 'DB Host', placeholder: envDefaults.dbHost },
                  { field: 'dbPort', label: 'DB Port', placeholder: String(envDefaults.dbPort) },
                  { field: 'redisHost', label: 'Redis Host', placeholder: envDefaults.redisHost },
                  { field: 'redisPort', label: 'Redis Port', placeholder: String(envDefaults.redisPort) },
                  { field: 'reverbHost', label: 'Reverb Host', placeholder: envDefaults.reverbHost },
                  { field: 'reverbPort', label: 'Reverb Port', placeholder: String(envDefaults.reverbPort) },
                  { field: 'appUrl', label: 'App URL', placeholder: envDefaults.appUrl },
                ] as { field: keyof Overrides; label: string; placeholder: string }[]
              ).map(({ field, label, placeholder }) => {
                const val = overrides[field];
                const display = val !== undefined ? String(val) : '';
                const isModified = val !== undefined;
                return (
                  <div key={field} className="flex items-center gap-3 px-3 py-2">
                    <label className="w-24 shrink-0 text-xs text-neutral-400">{label}</label>
                    <input
                      type="text"
                      value={display}
                      placeholder={placeholder}
                      onChange={(e) => handleOverrideChange(field, e.target.value)}
                      className="flex-1 bg-transparent text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none"
                    />
                    {isModified && (
                      <span className="shrink-0 text-xs text-indigo-400">modifié</span>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-neutral-600">
              Laisser vide pour utiliser la valeur du .env
            </p>
          </section>
        )}

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
