interface Props {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ title, description, action }: Props) {
  return (
    <div className="rounded-xl px-6 py-12 text-center" style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
      <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>{title}</p>
      {description && (
        <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>{description}</p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 rounded-lg px-4 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          style={{ background: 'var(--bg-card)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
