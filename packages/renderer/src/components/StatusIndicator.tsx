type Status = 'up' | 'unhealthy' | 'down' | 'unknown';

interface Props {
  status: Status;
  label?: string;
}

const DOT_CLASS: Record<Status, string> = {
  up: 'bg-emerald-400',
  unhealthy: 'bg-yellow-400',
  down: 'bg-red-400',
  unknown: 'bg-neutral-500',
};

const STATUS_LABEL: Record<Status, string> = {
  up: 'En ligne',
  unhealthy: 'Dégradé',
  down: 'Hors ligne',
  unknown: 'Inconnu',
};

export function StatusIndicator({ status, label }: Props) {
  const text = label ?? STATUS_LABEL[status];
  return (
    <span
      className="inline-flex items-center gap-1.5"
      aria-label={text}
      title={text}
    >
      <span
        className={`inline-block h-2 w-2 rounded-full ${DOT_CLASS[status]}`}
        aria-hidden="true"
      />
      <span className="text-xs text-neutral-400">{text}</span>
    </span>
  );
}
