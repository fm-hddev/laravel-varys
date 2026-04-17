interface Props {
  channel: string;
  event: string;
  onChannelChange: (v: string) => void;
  onEventChange: (v: string) => void;
}

export function BroadcastFilters({ channel, event, onChannelChange, onEventChange }: Props) {
  return (
    <div className="flex gap-3 flex-wrap" role="search" aria-label="Filtres événements">
      <input
        type="search"
        placeholder="Filtrer par channel…"
        value={channel}
        onChange={(e) => onChannelChange(e.target.value)}
        aria-label="Filtrer par channel"
        className="flex-1 min-w-32 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      />
      <input
        type="search"
        placeholder="Filtrer par événement…"
        value={event}
        onChange={(e) => onEventChange(e.target.value)}
        aria-label="Filtrer par événement"
        className="flex-1 min-w-32 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      />
    </div>
  );
}
