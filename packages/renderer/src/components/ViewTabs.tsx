import type { CSSProperties, ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  icon: ReactNode;
  badge?: number;
  badgeVariant?: 'warning' | 'danger';
}

interface Props {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

const BADGE_STYLES: Record<NonNullable<Tab['badgeVariant']>, CSSProperties> = {
  warning: { background: 'var(--hd-amber-500, #F59E0B)', color: '#000' },
  danger: { background: 'var(--log-error, #EF4444)', color: '#fff' },
};

export function ViewTabs({ tabs, activeTab, onTabChange }: Props) {
  return (
    <div
      className="flex items-center gap-1 px-2"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors"
            style={{
              color: isActive ? 'var(--hd-violet-400)' : 'var(--text-muted, #6B7280)',
              borderBottom: isActive ? '2px solid var(--hd-violet-500)' : '2px solid transparent',
              background: 'transparent',
              marginBottom: '-1px',
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge != null && tab.badge > 0 && (
              <span
                className="rounded-full px-1.5 py-0.5 text-xs font-bold"
                style={BADGE_STYLES[tab.badgeVariant ?? 'warning']}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
