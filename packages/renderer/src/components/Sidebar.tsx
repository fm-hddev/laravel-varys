import { Cpu, Eye, Gear, Lightning, Stack, TerminalWindow } from '@phosphor-icons/react';
import { NavLink } from 'react-router-dom';

import { useQueueStats } from '@/hooks/useQueueStats';
import { useEventsStore } from '@/store/useEventsStore';

function Badge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span
      className="ml-auto rounded-full px-1.5 py-0.5 text-xs font-bold text-white"
      style={{ background: 'var(--hd-danger-500)' }}
      aria-label={`${count} notifications`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

function NavItem({
  to,
  icon,
  label,
  badge,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2',
          isActive
            ? 'border border-[var(--border-alt)] bg-[var(--hd-violet-600)]/10 text-[var(--text-3)]'
            : 'text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--text-2)]',
        ].join(' ')
      }
    >
      {icon}
      <span>{label}</span>
      {badge !== undefined && <Badge count={badge} />}
    </NavLink>
  );
}

export function Sidebar() {
  const paused = useEventsStore((s) => s.paused);
  const pendingCount = useEventsStore((s) => s.pending.length);
  const { data: stats } = useQueueStats();

  const totalFailed = stats?.queues.reduce((acc, q) => acc + q.failed, 0) ?? 0;
  const eventsBadge = paused ? pendingCount : 0;

  return (
    <aside
      style={{
        width: 'var(--hd-sidebar-width)',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
      }}
      className="flex h-screen flex-shrink-0 flex-col px-3 py-4"
      aria-label="Navigation principale"
    >
      {/* Logo */}
      <div className="mb-6 flex items-center gap-2 px-3">
        <Eye size={20} weight="fill" style={{ color: 'var(--hd-violet-500)' }} />
        <span
          className="text-base font-bold"
          style={{
            background: 'linear-gradient(90deg, var(--hd-violet-500), var(--hd-emerald-400))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Varys
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1">
        <NavItem to="/processes" icon={<Cpu size={16} />} label="Processus" />
        <NavItem to="/events" icon={<Lightning size={16} />} label="Événements" badge={eventsBadge} />
        <NavItem to="/queues" icon={<Stack size={16} />} label="Queues" badge={totalFailed} />
        <NavItem to="/logs" icon={<TerminalWindow size={16} />} label="Logs" />
      </nav>

      {/* Settings en bas */}
      <div className="mt-auto">
        <NavItem to="/settings" icon={<Gear size={16} />} label="Paramètres" />
      </div>
    </aside>
  );
}
