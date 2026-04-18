import { Lightning, TerminalWindow } from '@phosphor-icons/react';
import { useState } from 'react';

import { BroadcastItem } from '@/components/BroadcastItem';
import { LogPanel } from '@/components/LogPanel';
import { ViewTabs } from '@/components/ViewTabs';
import { useEventsStream } from '@/hooks/useEventsStream';
import { useLogStream } from '@/hooks/useLogStream';
import { useProcessStream } from '@/hooks/useProcessStream';
import { useEventsStore } from '@/store/useEventsStore';

export default function EventsView() {
  useEventsStream();

  const [activeTab, setActiveTab] = useState<'events' | 'logs'>('events');

  const { data: processes } = useProcessStream();
  const reverbProcess = processes?.find((p) =>
    p.name.toLowerCase().includes('reverb'),
  );
  const reverbLogs = useLogStream(reverbProcess?.id ?? '', !!reverbProcess);

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

  function handleClearAll() {
    clearAll();
    setChannelFilter('');
    setEventFilter('');
  }

  const filtered = broadcasts.filter(
    (b) =>
      b.channel.toLowerCase().includes(channelFilter.toLowerCase()) &&
      b.event.toLowerCase().includes(eventFilter.toLowerCase()),
  );

  const tabs = [
    {
      id: 'events',
      label: 'Événements',
      icon: <Lightning size={14} />,
      badge: paused ? pending.length : 0,
      badgeVariant: 'warning' as const,
    },
    { id: 'logs', label: 'Logs Reverb', icon: <TerminalWindow size={14} /> },
  ];

  return (
    <main className="flex h-full flex-col overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <ViewTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as 'events' | 'logs')}
      />

      {activeTab === 'events' && (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}
          >
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>
                Événements
              </h1>
              {paused && pending.length > 0 && (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-bold"
                  style={{ background: 'var(--hd-amber-500, #F59E0B)', color: '#000' }}
                >
                  +{pending.length} en attente
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{
                    background: paused ? 'var(--hd-amber-500, #F59E0B)' : 'var(--hd-green-500, #22C55E)',
                    boxShadow: paused ? 'none' : '0 0 6px var(--hd-green-500, #22C55E)',
                  }}
                />
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  {paused ? 'EN PAUSE' : 'LIVE'}
                </span>
              </div>
              <button
                type="button"
                onClick={handlePauseResume}
                aria-label={paused ? 'Reprendre la réception des événements' : 'Mettre en pause la réception'}
                className="rounded px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                style={{
                  background: paused ? 'var(--hd-amber-500, #F59E0B)' : 'var(--bg-card)',
                  color: paused ? '#000' : 'var(--text-1)',
                  border: '1px solid var(--border)',
                }}
              >
                {paused ? 'Reprendre' : 'Pause'}
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                aria-label="Vider la liste des événements"
                className="rounded px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                style={{ background: 'var(--bg-card)', color: 'var(--text-1)', border: '1px solid var(--border)' }}
              >
                Vider
              </button>
            </div>
          </div>

          {/* Filters */}
          <div
            className="flex items-center gap-3 px-6 py-3 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <input
              type="search"
              placeholder="Filtrer par canal…"
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              aria-label="Filtrer par canal"
              className="flex-1 min-w-0 rounded px-3 py-1.5 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
            />
            <input
              type="search"
              placeholder="Filtrer par événement…"
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              aria-label="Filtrer par événement"
              className="flex-1 min-w-0 rounded px-3 py-1.5 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
            />
            <span className="flex-shrink-0 text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
              {filtered.length} / {broadcasts.length}
            </span>
          </div>

          {/* Column headers */}
          <div
            className="flex items-center gap-2.5 px-4 py-2 flex-shrink-0 text-xs font-medium"
            style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--bg-base)' }}
          >
            <span className="w-28 shrink-0">Canal</span>
            <span className="flex-1">Événement</span>
            <span className="w-16 shrink-0 text-right">Heure</span>
            <span className="w-16 shrink-0" />
          </div>

          {broadcasts.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center px-6">
                <p className="text-sm font-medium text-neutral-300">Aucun événement reçu</p>
                <p className="mt-1 text-xs text-neutral-500">
                  Assurez-vous que <code className="text-neutral-400">REVERB_SCALING_ENABLED=true</code> est défini dans votre .env
                </p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-neutral-400">Aucun résultat pour ces filtres</p>
            </div>
          ) : (
            <div
              className="flex-1 overflow-y-auto"
              style={{ background: 'var(--bg-surface)' }}
              role="list"
              aria-label="Liste des événements"
              aria-live="polite"
              aria-atomic="false"
            >
              {filtered.map((b) => (
                <div key={b.id} role="listitem">
                  <BroadcastItem broadcast={b} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="flex flex-1 flex-col overflow-hidden p-4 gap-2">
          <div className="flex items-center justify-between flex-shrink-0">
            <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-3)' }}>
              <TerminalWindow size={15} />
              Logs Reverb — {reverbProcess?.name ?? 'reverb'}
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{
                  background: reverbProcess ? 'var(--hd-green-500, #22C55E)' : 'var(--text-muted)',
                  boxShadow: reverbProcess ? '0 0 6px var(--hd-green-500, #22C55E)' : 'none',
                }}
              />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {reverbProcess ? 'LIVE' : 'INACTIF'}
              </span>
            </div>
          </div>
          {reverbProcess ? (
            <LogPanel lines={reverbLogs} className="flex-1" />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Processus Reverb non détecté</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
