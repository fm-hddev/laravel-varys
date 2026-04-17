import { useState } from 'react';

import { BroadcastFilters } from '@/components/BroadcastFilters';
import { BroadcastItem } from '@/components/BroadcastItem';
import { useEventsStream } from '@/hooks/useEventsStream';
import { useEventsStore } from '@/store/useEventsStore';

export default function EventsView() {
  useEventsStream();

  const broadcasts = useEventsStore((s) => s.broadcasts);
  const pending = useEventsStore((s) => s.pending);
  const paused = useEventsStore((s) => s.paused);
  const setPaused = useEventsStore((s) => s.setPaused);
  const flushPending = useEventsStore((s) => s.flushPending);
  const clearAll = useEventsStore((s) => s.clearAll);

  const [channelFilter, setChannelFilter] = useState('');
  const [eventFilter, setEventFilter] = useState('');

  function handlePauseResume() {
    if (paused) {
      flushPending();
      setPaused(false);
    } else {
      setPaused(true);
    }
  }

  const filtered = broadcasts.filter(
    (b) =>
      b.channel.toLowerCase().includes(channelFilter.toLowerCase()) &&
      b.event.toLowerCase().includes(eventFilter.toLowerCase()),
  );

  return (
    <main className="flex min-h-screen flex-col bg-neutral-950 px-6 py-8">
      <div className="mx-auto w-full max-w-3xl flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-xl font-bold text-neutral-100">
            Événements
            {paused && pending.length > 0 && (
              <span className="ml-2 rounded-full bg-yellow-800 px-2 py-0.5 text-xs font-normal text-yellow-300">
                +{pending.length} en attente
              </span>
            )}
          </h1>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePauseResume}
              aria-label={paused ? 'Reprendre la réception des événements' : 'Mettre en pause la réception'}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                paused
                  ? 'bg-yellow-800 text-yellow-200 hover:bg-yellow-700'
                  : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
              }`}
            >
              {paused ? 'Reprendre' : 'Pause'}
            </button>
            <button
              type="button"
              onClick={clearAll}
              aria-label="Vider la liste des événements"
              className="rounded-lg bg-neutral-800 px-3 py-1.5 text-sm font-medium text-neutral-200 hover:bg-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              Vider
            </button>
          </div>
        </div>

        <BroadcastFilters
          channel={channelFilter}
          event={eventFilter}
          onChannelChange={setChannelFilter}
          onEventChange={setEventFilter}
        />

        {broadcasts.length === 0 ? (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-6 py-12 text-center">
            <p className="text-sm font-medium text-neutral-300">Aucun événement reçu</p>
            <p className="mt-1 text-xs text-neutral-500">
              Assurez-vous que <code className="text-neutral-400">REVERB_SCALING_ENABLED=true</code> est défini dans votre .env
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-6 py-8 text-center">
            <p className="text-sm text-neutral-400">Aucun résultat pour ces filtres</p>
          </div>
        ) : (
          <div
            className="flex flex-col gap-2 overflow-y-auto"
            role="list"
            aria-label="Liste des événements"
            aria-live="polite"
            aria-atomic="false"
          >
            {filtered.map((b, i) => (
              <div key={b.id} role="listitem">
                <BroadcastItem broadcast={b} index={i} />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
