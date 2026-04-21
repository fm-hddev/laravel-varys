import varysLogoSrc from '@/assets/varys_logo_0.png';
import { cn } from '@/lib/utils';

interface VarysLogoProps {
  /** Hauteur en px — défaut : 32 */
  size?: number;
  /** Affiche le nom "Varys" à côté de l'icône */
  withName?: boolean;
  /** Variante de couleur du texte */
  variant?: 'default' | 'muted' | 'white';
  className?: string;
}

export function VarysLogo({
  size = 32,
  withName = false,
  variant = 'default',
  className,
}: VarysLogoProps) {
  return (
    <div className={cn('flex items-center gap-2 select-none', className)}>
      <img
        src={varysLogoSrc}
        alt="Varys logo"
        width={size}
        height={size}
        className="flex-shrink-0"
      />

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

export function VarysIcon({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <img
      src={varysLogoSrc}
      alt="Varys logo"
      width={size}
      height={size}
      className={cn('flex-shrink-0', className)}
    />
  );
}

export default VarysLogo;
