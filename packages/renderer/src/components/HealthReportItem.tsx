interface Props {
  name: string;
  available: boolean;
  reason?: string;
}

export function HealthReportItem({ name, available, reason }: Props) {
  return (
    <div
      className="flex items-start gap-3 rounded-lg p-3"
      style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
    >
      <span
        className="mt-0.5 text-base leading-none"
        aria-label={available ? 'Disponible' : 'Indisponible'}
      >
        {available ? '✅' : reason ? '❌' : '⚠️'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{name}</p>
        {!available && reason && (
          <p className="mt-0.5 text-xs" style={{ color: 'var(--text-3)' }}>{reason}</p>
        )}
      </div>
    </div>
  );
}
