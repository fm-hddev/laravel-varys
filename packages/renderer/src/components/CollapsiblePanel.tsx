import { CaretDown } from '@phosphor-icons/react';
import type { CSSProperties, ReactNode } from 'react';
import { useState } from 'react';

interface Props {
  title: string;
  icon: ReactNode;
  count?: number;
  countVariant?: 'violet' | 'danger' | 'warning';
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

const COUNT_STYLES: Record<NonNullable<Props['countVariant']>, CSSProperties> = {
  violet: { background: 'var(--hd-violet-500)', color: '#fff' },
  danger: { background: 'var(--log-error, #EF4444)', color: '#fff' },
  warning: { background: 'var(--hd-amber-500, #F59E0B)', color: '#000' },
};

export function CollapsiblePanel({
  title,
  icon,
  count,
  countVariant = 'violet',
  defaultOpen = false,
  children,
  className = '',
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{ border: '1px solid var(--border)', borderRadius: 'var(--hd-radius-xl, 12px)' }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 p-3 text-sm font-medium"
        style={{ background: 'var(--bg-card)', cursor: 'pointer' }}
        aria-expanded={open}
      >
        {icon}
        <span className="flex-1 text-left">{title}</span>
        {count != null && count > 0 && (
          <span
            className="rounded-full px-1.5 py-0.5 text-xs font-bold"
            style={COUNT_STYLES[countVariant]}
          >
            {count}
          </span>
        )}
        <CaretDown
          size={14}
          style={{ transition: 'transform 200ms', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {open && <div>{children}</div>}
    </div>
  );
}
