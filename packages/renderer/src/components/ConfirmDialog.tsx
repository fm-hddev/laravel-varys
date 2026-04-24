import { Warning } from '@phosphor-icons/react';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmer la suppression',
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(3px)',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '24px 28px',
          width: 380,
          maxWidth: '90vw',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 14,
            color: 'var(--hd-danger-500)',
          }}
        >
          <Warning size={20} />
        </div>

        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>
          {title}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
          {message}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '7px 16px',
              fontSize: 12.5,
              borderRadius: 7,
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-2)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '7px 16px',
              fontSize: 12.5,
              borderRadius: 7,
              background: 'var(--hd-danger-600, #DC2626)',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
