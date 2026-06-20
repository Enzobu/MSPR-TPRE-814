import type { AlertType } from '@futurekawa/contracts';
import { cn } from '@/lib/utils';
import { alertSeverity } from '@/features/alerts/lib/severity';

type SeverityPillProps = Readonly<{
  type: AlertType;
  className?: string;
}>;

// Pill colorée par sévérité (dérivée du type d'alerte, cf. lib/severity).
// Icône lucide + libellé court. Couleurs via tokens statut uniquement.
export function SeverityPill({ type, className }: SeverityPillProps) {
  const { label, pillClassName, Icon } = alertSeverity(type);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        pillClassName,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}
