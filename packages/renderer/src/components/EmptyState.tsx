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
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-6 py-12 text-center">
      <p className="text-sm font-medium text-neutral-300">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-neutral-500">{description}</p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 rounded-lg bg-neutral-800 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
