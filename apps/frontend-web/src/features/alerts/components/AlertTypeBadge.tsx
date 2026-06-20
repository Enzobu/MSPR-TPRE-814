import type { AlertType } from '@futurekawa/contracts';
import { SeverityPill } from '@/features/alerts/components/SeverityPill';

type AlertTypeBadgeProps = Readonly<{
  type: AlertType;
  className?: string;
}>;

// Conservé pour compatibilité des imports : rend la pill de sévérité (le type
// d'alerte porte la couleur, cf. lib/severity).
export function AlertTypeBadge({ type, className }: AlertTypeBadgeProps) {
  return <SeverityPill type={type} className={className} />;
}
