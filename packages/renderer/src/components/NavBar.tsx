import { NavLink } from 'react-router-dom';

import { useQueueStats } from '@/hooks/useQueueStats';
import { useEventsStore } from '@/store/useEventsStore';

const LINK_BASE =
  'relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400';
const LINK_ACTIVE = 'bg-neutral-800 text-neutral-100';
const LINK_IDLE = 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200';

function Badge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span
      className="rounded-full bg-red-700 px-1.5 py-0.5 text-xs font-bold text-white"
      aria-label={`${count} notifications`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

export function NavBar() {
  const paused = useEventsStore((s) => s.paused);
  const pendingCount = useEventsStore((s) => s.pending.length);
  const { data: stats } = useQueueStats();

  const totalFailed = stats?.queues.reduce((acc, q) => acc + q.failed, 0) ?? 0;
  const eventsBadge = paused ? pendingCount : 0;

  return (
    <nav
      className="flex items-center gap-1 border-b border-neutral-800 bg-neutral-950 px-4 py-2"
      aria-label="Navigation principale"
    >
      <NavLink
        to="/processes"
        className={({ isActive }) => `${LINK_BASE} ${isActive ? LINK_ACTIVE : LINK_IDLE}`}
        aria-current={undefined}
      >
        Processus
      </NavLink>
      <NavLink
        to="/events"
        className={({ isActive }) => `${LINK_BASE} ${isActive ? LINK_ACTIVE : LINK_IDLE}`}
      >
        Événements
        <Badge count={eventsBadge} />
      </NavLink>
      <NavLink
        to="/queues"
        className={({ isActive }) => `${LINK_BASE} ${isActive ? LINK_ACTIVE : LINK_IDLE}`}
      >
        Queues
        <Badge count={totalFailed} />
      </NavLink>
      <NavLink
        to="/logs"
        className={({ isActive }) => `${LINK_BASE} ${isActive ? LINK_ACTIVE : LINK_IDLE}`}
      >
        Logs
      </NavLink>
      <div className="ml-auto">
        <NavLink
          to="/settings"
          className={({ isActive }) => `${LINK_BASE} ${isActive ? LINK_ACTIVE : LINK_IDLE}`}
          aria-label="Paramètres"
        >
          ⚙
        </NavLink>
      </div>
    </nav>
  );
}
