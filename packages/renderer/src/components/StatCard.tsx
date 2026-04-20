import type { CSSProperties } from 'react';

interface Props {
  label: string;
  value: number | string;
  variant: 'violet' | 'emerald' | 'danger' | 'warning' | 'neutral';
}

const VARIANT_STYLES: Record<Props['variant'], CSSProperties> = {
  violet: { color: 'var(--hd-violet-400)', borderColor: 'var(--hd-violet-500)' },
  emerald: { color: 'var(--hd-emerald-400, #34D399)', borderColor: 'var(--hd-emerald-500, #10B981)' },
  danger: { color: 'var(--log-error, #EF4444)', borderColor: 'var(--log-error, #EF4444)' },
  warning: { color: 'var(--hd-amber-500, #F59E0B)', borderColor: 'var(--hd-amber-500, #F59E0B)' },
  neutral: { color: 'var(--text-muted, #6B7280)', borderColor: 'var(--border)' },
};

export function StatCard({ label, value, variant }: Props) {
  const styles = VARIANT_STYLES[variant];

  return (
    <div
      className="flex flex-col gap-1 rounded-lg px-3 py-2"
      style={{ background: 'var(--bg-card)', border: `1px solid ${styles.borderColor}` }}
    >
      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted, #6B7280)' }}>
        {label}
      </span>
      <span className="font-mono text-2xl font-bold" style={{ color: styles.color }}>
        {value}
      </span>
    </div>
  );
}
