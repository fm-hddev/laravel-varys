import { CheckCircle } from '@phosphor-icons/react';
import type { HealthReport } from '@varys/core';

interface Props {
  report: HealthReport;
  onToggle: (adapterId: string, enabled: boolean) => void;
}

export function AdapterConfig({ report, onToggle }: Props) {
  return (
    <div className="rounded-lg" style={{ border: '1px solid var(--border)', overflow: 'hidden' }}>
      <ul role="list">
        {report.adapters.map((adapter) => {
          const id = `adapter-toggle-${adapter.id}`;
          return (
            <li
              key={adapter.id}
              className="flex items-center justify-between gap-3 px-4 py-2.5"
              style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}
            >
              <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium cursor-pointer" style={{ color: 'var(--text-1)' }}>
                {adapter.name}
              </label>
              <div className="flex items-center gap-3 ml-auto">
                {adapter.result.available ? (
                  <CheckCircle size={15} weight="fill" style={{ color: 'var(--hd-emerald-400)' }} />
                ) : (
                  <span className="text-xs font-mono" style={{ color: 'var(--hd-danger-500)' }}>
                    {adapter.result.reason}
                  </span>
                )}
                <button
                  id={id}
                  type="button"
                  role="switch"
                  aria-checked={adapter.result.available}
                  aria-label={`${adapter.result.available ? 'Désactiver' : 'Activer'} ${adapter.name}`}
                  onClick={() => onToggle(adapter.id, !adapter.result.available)}
                  className="relative inline-flex h-5 w-9 items-center rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                  style={{ background: adapter.result.available ? 'var(--hd-violet-600)' : 'var(--border)' }}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${
                      adapter.result.available ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
