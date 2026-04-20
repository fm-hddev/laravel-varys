import { useEffect } from 'react';

import { useEventsStore } from '@/store/useEventsStore';

const POLL_INTERVAL_MS = 2000;

// Module-level : survit aux remontages du composant
const seenIds = new Set<string>();

export function clearSeenIds() {
  seenIds.clear();
}

export function useEventsStream() {
  const addBroadcasts = useEventsStore((s) => s.addBroadcasts);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const broadcasts = await window.varys.invoke('events:broadcast');
        if (cancelled) return;
        const newOnes = broadcasts.filter((b) => !seenIds.has(b.id));
        if (newOnes.length > 0) {
          newOnes.forEach((b) => seenIds.add(b.id));
          addBroadcasts(newOnes);
        }
      } catch {
        // silent — adapter may be unavailable
      }
    }

    void poll();
    const id = setInterval(() => void poll(), POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [addBroadcasts]);
}
