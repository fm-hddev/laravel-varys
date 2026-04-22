import { Desktop, FolderOpen, Gear, Moon, PlugsConnected, Sun } from '@phosphor-icons/react';
import type { HealthReport as HealthReportType, KnownPath } from '@varys/core';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AdapterConfig } from '@/components/AdapterConfig';
import { KnownProjectsList } from '@/components/KnownProjectsList';
import { useTheme, type ThemeMode } from '@/components/ThemeProvider';
import { ViewTabs } from '@/components/ViewTabs';
import { useIpc } from '@/hooks/useIpc';
import { useProjectStore } from '@/store/useProjectStore';

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type SectionId = 'project' | 'connections' | 'adapters' | 'appearance';

const TABS = [
  { id: 'project',     label: 'Projet',     icon: <FolderOpen size={16} />    },
  { id: 'connections', label: 'Connexions', icon: <PlugsConnected size={16} /> },
  { id: 'adapters',    label: 'Adapters',   icon: <Gear size={16} />          },
  { id: 'appearance',  label: 'Apparence',  icon: <Sun size={16} />           },
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
    <div className="flex h-full flex-col" style={{ background: 'var(--bg-base)' }}>
      {/* ── Page header ── */}
      <div
        className="flex items-center justify-between gap-3 px-6 py-3 shrink-0"
        style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}
      >
        <h1 className="text-base font-bold" style={{ color: 'var(--text-1)' }}>Paramètres</h1>
        <button
          type="button"
          onClick={() => { void navigate(-1); }}
          className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          style={{ color: 'var(--text-3)' }}
        >
          ← Retour
        </button>
      </div>

      {/* ── Tab bar ── */}
      <ViewTabs
        tabs={TABS}
        activeTab={activeSection}
        onTabChange={(id) => setActiveSection(id as SectionId)}
      />

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-7 py-6" style={{ maxWidth: 640 }}>
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
      </div>
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
      <SectionHeader title="Projets connus" />
      <KnownProjectsList
        paths={knownPaths}
        activePath={activePath}
        onSwitch={(path) => { void onSwitch(path); }}
        onRemove={(path) => { void onRemove(path); }}
        onNavigate={onNavigate}
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
    return <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Chargement…</p>;
  }

  function Field({ field, label, placeholder }: { field: keyof Overrides; label: string; placeholder: string }) {
    const val = overrides[field];
    const display = val !== undefined ? String(val) : '';
    const isModified = val !== undefined;
    return (
      <div className="flex items-center gap-3 px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
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
  }

  return (
    <>
      <SectionHeader title="Base de données" />
      <div className="rounded-lg mb-5" style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', overflow: 'hidden' }}>
        <Field field="dbHost" label="DB Host" placeholder={envDefaults.dbHost} />
        <Field field="dbPort" label="DB Port" placeholder={String(envDefaults.dbPort)} />
      </div>

      <SectionHeader title="Redis" />
      <div className="rounded-lg mb-5" style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', overflow: 'hidden' }}>
        <Field field="redisHost" label="Redis Host" placeholder={envDefaults.redisHost} />
        <Field field="redisPort" label="Redis Port" placeholder={String(envDefaults.redisPort)} />
      </div>

      <SectionHeader title="Reverb" />
      <div className="rounded-lg mb-3" style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', overflow: 'hidden' }}>
        <Field field="reverbHost" label="Reverb Host" placeholder={envDefaults.reverbHost} />
        <Field field="reverbPort" label="Reverb Port" placeholder={String(envDefaults.reverbPort)} />
        <Field field="appUrl" label="App URL" placeholder={envDefaults.appUrl} />
      </div>

      <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
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
