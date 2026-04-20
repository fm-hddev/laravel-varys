/**
 * VarysLogo — composant logo in-app
 *
 * Usage :
 *   <VarysLogo size={32} />                  → icône seule
 *   <VarysLogo size={24} withName />          → icône + "Varys"
 *   <VarysLogo size={20} withName variant="muted" />
 *
 * Le SVG est un tracé simplifié de l'oiseau Varys (inline, zéro dépendance).
 */

import { useId } from 'react';

import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VarysLogoProps {
  /** Taille en px (hauteur = largeur) — défaut : 32 */
  size?: number;
  /** Affiche le nom "Varys" à côté de l'icône */
  withName?: boolean;
  /** Variante de couleur */
  variant?: 'default' | 'muted' | 'white';
  className?: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function VarysLogo({
  size = 32,
  withName = false,
  variant = 'default',
  className,
}: VarysLogoProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 select-none',
        className,
      )}
    >
      <VarysIcon size={size} variant={variant} />

      {withName && (
        <span
          className={cn(
            'font-semibold tracking-tight',
            variant === 'default' ? 'text-foreground' :
            variant === 'muted'   ? 'text-muted-foreground' :
            'text-white',
          )}
          style={{ fontSize: size * 0.6 }}
        >
          Varys
        </span>
      )}
    </div>
  );
}

// ─── Icône SVG inline ─────────────────────────────────────────────────────────

interface VarysIconProps {
  size?: number;
  variant?: 'default' | 'muted' | 'white';
  className?: string;
}

export function VarysIcon({ size = 32, variant = 'default', className }: VarysIconProps) {
  // Gradient IDs uniques pour éviter les collisions si plusieurs instances
  const gradId = useId().replace(/:/g, '');

  const strokeColor =
    variant === 'white'   ? 'white'                   :
    variant === 'muted'   ? 'currentColor'             :
    'url(#varys-grad-' + gradId + ')';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('flex-shrink-0', className)}
      aria-label="Varys logo"
    >
      <defs>
        <linearGradient
          id={`varys-grad-${gradId}`}
          x1="0" y1="0" x2="64" y2="64"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%"   stopColor="#a78bfa" /> {/* violet */}
          <stop offset="50%"  stopColor="#34d399" /> {/* emerald */}
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>

      {/* ── Corps de l'oiseau ── */}
      <path
        d="M38 14 C46 16 52 22 50 32 C48 40 40 46 30 44 C22 42 16 36 18 28 C20 18 30 12 38 14 Z"
        stroke={strokeColor}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ── Tête ── */}
      <circle cx="44" cy="18" r="5" stroke={strokeColor} strokeWidth="2" />

      {/* ── Œil ── */}
      <circle cx="46" cy="17" r="1.2" fill={strokeColor === 'url(#varys-grad-' + gradId + ')' ? '#34d399' : 'currentColor'} />

      {/* ── Bec ── */}
      <path
        d="M49 19 L54 20 L49 21"
        stroke={strokeColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ── Aile géométrique (triangle / éclair Electron-style) ── */}
      <path
        d="M18 28 L8 16 L22 22 Z"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 22 L12 36 L26 30"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ── Heartbeat / monitoring (sur le corps) ── */}
      <path
        d="M26 32 L29 32 L31 28 L33 36 L35 32 L38 32"
        stroke={strokeColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ── Queue ── */}
      <path
        d="M18 42 L10 50 M20 44 L14 54"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default VarysLogo;
