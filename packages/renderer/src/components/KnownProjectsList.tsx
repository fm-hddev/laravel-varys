import type { KnownPath } from '@varys/core';

interface Props {
  paths: KnownPath[];
  activePath: string | null;
  onSwitch: (path: string) => void;
  onRemove: (path: string) => void;
}

export function KnownProjectsList({ paths, activePath, onSwitch, onRemove }: Props) {
  if (paths.length === 0) {
    return <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Aucun projet connu.</p>;
  }

  return (
    <ul className="flex flex-col gap-2" role="list">
      {paths.map((kp) => {
        const isActive = kp.projectPath === activePath;
        return (
          <li
            key={kp.projectPath}
            className="flex items-center justify-between gap-3 rounded-lg px-3 py-2"
            style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
          >
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-sm font-medium"
                style={{ color: 'var(--text-1)' }}
                title={kp.projectPath}
              >
                {kp.label || kp.projectPath}
              </p>
              <p className="truncate text-xs" style={{ color: 'var(--text-muted)' }} title={kp.projectPath}>
                {kp.projectPath}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              {!isActive && (
                <button
                  type="button"
                  onClick={() => onSwitch(kp.projectPath)}
                  aria-label={`Switcher vers ${kp.label || kp.projectPath}`}
                  className="rounded px-2 py-1 text-xs font-medium text-indigo-400 hover:bg-indigo-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  Switch
                </button>
              )}
              {isActive && (
                <span className="px-2 py-1 text-xs text-emerald-400">Actif</span>
              )}
              <button
                type="button"
                onClick={() => onRemove(kp.projectPath)}
                aria-label={`Supprimer ${kp.label || kp.projectPath}`}
                className="rounded px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                Supprimer
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
