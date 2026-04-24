import { Swap } from '@phosphor-icons/react';
import type { KnownPath } from '@varys/core';

interface Props {
  paths: KnownPath[];
  activePath: string | null;
  onSwitch: (path: string) => void;
  onRemove: (path: string) => void;
  onNavigate: () => void;
}

export function KnownProjectsList({ paths, activePath, onSwitch, onRemove, onNavigate }: Props) {
  return (
    <>
      {paths.length > 0 && (
        <ul className="flex flex-col gap-2 mb-4" role="list">
          {paths.map((kp) => {
            const isActive = kp.projectPath === activePath;
            return (
              <li
                key={kp.projectPath}
                className="flex items-center justify-between gap-3 rounded-lg px-3 py-2"
                style={
                  isActive
                    ? {
                        border: '1px solid var(--border)',
                        borderLeft: '3px solid var(--hd-violet-500)',
                        background: 'linear-gradient(135deg, rgba(109,40,217,0.08) 0%, rgba(16,185,129,0.04) 100%)',
                      }
                    : { border: '1px solid var(--border)', background: 'var(--bg-surface)' }
                }
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" style={{ color: 'var(--text-1)' }} title={kp.projectPath}>
                    {kp.label || kp.projectPath}
                  </p>
                  <p className="truncate text-xs" style={{ color: 'var(--text-muted)' }} title={kp.projectPath}>
                    {kp.projectPath}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {isActive ? (
                    <span className="text-xs font-medium" style={{ color: 'var(--hd-emerald-400)' }}>Actif</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSwitch(kp.projectPath)}
                      aria-label={`Activer ${kp.label || kp.projectPath}`}
                      className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-indigo-400 hover:bg-indigo-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                    >
                      <Swap size={12} />
                      Activer
                    </button>
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
      )}
      {paths.length === 0 && (
        <p className="mb-4 text-sm" style={{ color: 'var(--text-muted)' }}>Aucun projet connu.</p>
      )}
      <button
        type="button"
        onClick={onNavigate}
        className="w-full rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        style={{ border: '1px dashed var(--border)', color: 'var(--text-muted)', background: 'transparent' }}
      >
        + Autre projet…
      </button>
    </>
  );
}
