import { Desktop, FolderOpen, Gear, Moon, PlugsConnected, Sun } from '@phosphor-icons/react';
import type { HealthReport as HealthReportType, KnownPath } from '@varys/core';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AdapterConfig } from '@/components/AdapterConfig';
import { HealthReport } from '@/components/HealthReport';
import { KnownProjectsList } from '@/components/KnownProjectsList';
import { useTheme, type ThemeMode } from '@/components/ThemeProvider';
import { useIpc } from '@/hooks/useIpc';
import { useProjectStore } from '@/store/useProjectStore';

// ─── Nav items ────────────────────────────────────────────────────────────────

type SectionId = 'project' | 'connections' | 'adapters' | 'appearance';

const NAV_ITEMS: { id: SectionId; label: string; icon: React.ElementType }[] = [
  { id: 'project',     label: 'Projet',       icon: FolderOpen    },
  { id: 'connections', label: 'Connexions',   icon: PlugsConnected },
  { id: 'adapters',   label: 'Adapters',     icon: Gear          },
  { id: 'appearance', label: 'Apparence',    icon: Sun           },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const ipc = useIpc();
  const navigate = useNavigate();
  const { mode, setMode } = useTheme();
  const { activePath, setActivePath, knownPaths, setKnownPaths } = useProjectStore();

  const [activeSection, setActiveSection] = useState<SectionId>('project');
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

  const THEME_OPTIONS: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: 'light',  label: 'Clair',   icon: <Sun size={16} />     },
    { value: 'dark',   label: 'Sombre',  icon: <Moon size={16} />    },
    { value: 'system', label: 'Système', icon: <Desktop size={16} /> },
  ];

  return (
    <div className="flex h-full" style={{ background: 'var(--bg-base)' }}>
      {/* ── Sidebar nav ── */}
      <aside
        className="flex flex-shrink-0 flex-col py-6 px-3"
        style={{ width: 200, background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}
        aria-label="Sections des paramètres"
      >
        <p className="px-3 mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Paramètres
        </p>
        <nav className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveSection(id)}
              className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              style={
                activeSection === id
                  ? { background: 'var(--hd-violet-600, #6d28d9)20', color: 'var(--text-1)', border: '1px solid var(--border-alt, var(--border))' }
                  : { background: 'transparent', color: 'var(--text-muted)', border: '1px solid transparent' }
              }
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => { void navigate(-1); }}
            className="flex items-center gap-2 px-3 py-2 text-sm w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            style={{ color: 'var(--text-3)' }}
          >
            ← Retour
          </button>
        </div>
      </aside>

      {/* ── Content ── */}
      <main className="flex-1 overflow-y-auto px-8 py-8">
        {activeSection === 'project' && (
          <ProjectSection
            activePath={activePath}
            knownPaths={knownPaths}
            onSwitch={handleSwitch}
            onRemove={handleRemove}
            onNavigate={() => { void navigate('/welcome'); }}
          />
        )}
        {activeSection === 'connections' && (
          <ConnectionsSection
            envDefaults={envDefaults}
            overrides={overrides}
            onOverrideChange={handleOverrideChange}
          />
        )}
        {activeSection === 'adapters' && (
          <AdaptersSection report={report} onToggle={handleAdapterToggle} />
        )}
        {activeSection === 'appearance' && (
          <AppearanceSection
            mode={mode}
            themeOptions={THEME_OPTIONS}
            onSetMode={setMode}
          />
        )}
      </main>
    </div>
  );
}

// ─── Section: Project ─────────────────────────────────────────────────────────

function ProjectSection({
  activePath,
  knownPaths,
  onSwitch,
  onRemove,
  onNavigate,
}: {
  activePath: string | null;
  knownPaths: KnownPath[];
  onSwitch: (path: string) => Promise<void>;
  onRemove: (path: string) => Promise<void>;
  onNavigate: () => void;
}) {
  return (
    <>
      <SectionHeader title="Projet actif" />
      <div
        className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 mb-6"
        style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
      >
        <p className="truncate text-sm" style={{ color: 'var(--text-1)' }} title={activePath ?? undefined}>
          {activePath ?? <span style={{ color: 'var(--text-muted)' }}>Aucun projet sélectionné</span>}
        </p>
        <button
          type="button"
          onClick={onNavigate}
          className="shrink-0 rounded px-2 py-1 text-xs font-medium text-indigo-400 hover:bg-indigo-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          Changer
        </button>
      </div>

      <SectionHeader title="Projets connus" />
      <KnownProjectsList
        paths={knownPaths}
        activePath={activePath}
        onSwitch={(path) => { void onSwitch(path); }}
        onRemove={(path) => { void onRemove(path); }}
      />
    </>
  );
}

// ─── Section: Connections ─────────────────────────────────────────────────────

type EnvDefaults = { dbHost: string; dbPort: number; redisHost: string; redisPort: number; reverbHost: string; reverbPort: number; appUrl: string };
type Overrides = Partial<{ dbHost: string; dbPort: number; redisHost: string; redisPort: number; reverbHost: string; reverbPort: number; appUrl: string }>;

function ConnectionsSection({
  envDefaults,
  overrides,
  onOverrideChange,
}: {
  envDefaults: EnvDefaults | null;
  overrides: Overrides;
  onOverrideChange: (field: keyof Overrides, raw: string) => void;
}) {
  if (!envDefaults) {
    return (
      <>
        <SectionHeader title="Connexions" />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Chargement…</p>
      </>
    );
  }

  const fields: { field: keyof Overrides; label: string; placeholder: string }[] = [
    { field: 'dbHost',    label: 'DB Host',    placeholder: envDefaults.dbHost },
    { field: 'dbPort',    label: 'DB Port',    placeholder: String(envDefaults.dbPort) },
    { field: 'redisHost', label: 'Redis Host', placeholder: envDefaults.redisHost },
    { field: 'redisPort', label: 'Redis Port', placeholder: String(envDefaults.redisPort) },
    { field: 'reverbHost', label: 'Reverb Host', placeholder: envDefaults.reverbHost },
    { field: 'reverbPort', label: 'Reverb Port', placeholder: String(envDefaults.reverbPort) },
    { field: 'appUrl',    label: 'App URL',    placeholder: envDefaults.appUrl },
  ];

  return (
    <>
      <SectionHeader title="Connexions" />
      <div className="rounded-lg" style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        {fields.map(({ field, label, placeholder }, idx) => {
          const val = overrides[field];
          const display = val !== undefined ? String(val) : '';
          const isModified = val !== undefined;
          return (
            <div
              key={field}
              className="flex items-center gap-3 px-3 py-2"
              style={idx > 0 ? { borderTop: '1px solid var(--border)' } : undefined}
            >
              <label className="w-24 shrink-0 text-xs" style={{ color: 'var(--text-3)' }}>{label}</label>
              <input
                type="text"
                value={display}
                placeholder={placeholder}
                onChange={(e) => onOverrideChange(field, e.target.value)}
                className="flex-1 bg-transparent text-sm focus:outline-none"
                style={{ color: 'var(--text-1)' }}
              />
              {isModified && (
                <span className="shrink-0 text-xs" style={{ color: 'var(--hd-violet-400)' }}>modifié</span>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
        Laisser vide pour utiliser la valeur du .env
      </p>
    </>
  );
}

// ─── Section: Adapters ────────────────────────────────────────────────────────

function AdaptersSection({
  report,
  onToggle,
}: {
  report: HealthReportType | null;
  onToggle: (id: string, enabled: boolean) => Promise<void>;
}) {
  if (!report) {
    return (
      <>
        <SectionHeader title="Adapters" />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Chargement…</p>
      </>
    );
  }

  return (
    <>
      <SectionHeader title="Configuration des adapters" />
      <AdapterConfig
        report={report}
        onToggle={(id, enabled) => { void onToggle(id, enabled); }}
      />
      <SectionHeader title="État des adapters" className="mt-8" />
      <HealthReport report={report} />
    </>
  );
}

// ─── Section: Appearance ──────────────────────────────────────────────────────

function AppearanceSection({
  mode,
  themeOptions,
  onSetMode,
}: {
  mode: ThemeMode;
  themeOptions: { value: ThemeMode; label: string; icon: React.ReactNode }[];
  onSetMode: (mode: ThemeMode) => void;
}) {
  return (
    <>
      <SectionHeader title="Apparence" />
      <div className="rounded-lg" style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <div className="flex items-center justify-between gap-3 px-3 py-2">
          <span className="text-sm" style={{ color: 'var(--text-2)' }}>Thème</span>
          <div className="flex gap-2">
            {themeOptions.map(({ value, label, icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => onSetMode(value)}
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
    </>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function SectionHeader({ title, className }: { title: string; className?: string }) {
  return (
    <h2
      className={`mb-3 text-xs font-semibold uppercase tracking-widest ${className ?? ''}`}
      style={{ color: 'var(--text-muted)' }}
    >
      {title}
    </h2>
  );
}
