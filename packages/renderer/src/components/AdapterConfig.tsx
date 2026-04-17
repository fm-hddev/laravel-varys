import type { HealthReport } from '@varys/core';

interface Props {
  report: HealthReport;
  onToggle: (adapterId: string, enabled: boolean) => void;
}

export function AdapterConfig({ report, onToggle }: Props) {
  return (
    <ul className="flex flex-col gap-2" role="list">
      {report.adapters.map((adapter) => {
        const id = `adapter-toggle-${adapter.id}`;
        return (
          <li
            key={adapter.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
          >
            <label htmlFor={id} className="text-sm font-medium text-neutral-100 cursor-pointer">
              {adapter.name}
            </label>
            <button
              id={id}
              type="button"
              role="switch"
              aria-checked={adapter.result.available}
              aria-label={`${adapter.result.available ? 'Désactiver' : 'Activer'} ${adapter.name}`}
              onClick={() => onToggle(adapter.id, !adapter.result.available)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                adapter.result.available ? 'bg-indigo-600' : 'bg-neutral-700'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${
                  adapter.result.available ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
