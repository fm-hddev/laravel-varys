import { Cpu, Gear, Lightning, Stack, TerminalWindow } from '@phosphor-icons/react';
import { NavLink } from 'react-router-dom';

import { VarysLogo } from '@/components/VarysLogo';
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
            ? 'border text-[var(--text-3)]'
            : 'border border-transparent text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--text-2)]',
        ].join(' ')
      }
      style={({ isActive }) =>
        isActive
          ? {
              background: 'linear-gradient(135deg, rgba(109,40,217,0.18) 0%, rgba(16,185,129,0.08) 100%)',
              borderColor: 'rgba(109,40,217,0.3)',
            }
          : {}
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
      <div className="mb-6 px-3">
        <VarysLogo size={24} withName />
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1">
        <p style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          color: 'var(--text-muted)',
          padding: '4px 12px 4px',
          marginBottom: 2,
        }}>
          Navigation
        </p>
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
