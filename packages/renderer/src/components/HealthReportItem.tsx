interface Props {
  name: string;
  available: boolean;
  reason?: string;
}

export function HealthReportItem({ name, available, reason }: Props) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-3">
      <span
        className="mt-0.5 text-base leading-none"
        aria-label={available ? 'Disponible' : 'Indisponible'}
      >
        {available ? '✅' : reason ? '❌' : '⚠️'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-neutral-100">{name}</p>
        {!available && reason && (
          <p className="mt-0.5 text-xs text-neutral-400">{reason}</p>
        )}
      </div>
    </div>
  );
}
