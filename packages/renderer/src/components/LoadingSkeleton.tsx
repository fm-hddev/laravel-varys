interface Props {
  lines?: number;
}

export function LoadingSkeleton({ lines = 3 }: Props) {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Chargement…">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-neutral-800 bg-neutral-900 p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-neutral-800" />
              <div className="h-3 w-48 rounded bg-neutral-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
