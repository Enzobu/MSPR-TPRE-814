import { Link } from 'react-router';
import type { Alert } from '@futurekawa/contracts';
import { AcknowledgeButton } from '@/features/alerts/components/AcknowledgeButton';
import { SeverityPill } from '@/features/alerts/components/SeverityPill';
import { formatAgo } from '@/features/alerts/lib/format';
import { COUNTRY_LABELS } from '@/features/dashboard/lib/country';

type AlertCardProps = Readonly<{
  alert: Alert;
}>;

// Carte mobile : un lien en overlay (stretched) couvre toute la carte pour la
// navigation ; le bouton d'acquittement est posé au-dessus (z-index) et ne
// déclenche donc pas la navigation. Pattern accessible (pas de bouton imbriqué).
export function AlertCard({ alert }: AlertCardProps) {
  return (
    <div className="relative rounded-xl border bg-card p-4 transition-colors hover:bg-accent focus-within:ring-2 focus-within:ring-ring">
      <Link
        to={`/alerts/${alert.id}`}
        aria-label={`Détail de l'alerte ${alert.message}`}
        className="absolute inset-0 rounded-xl focus:outline-none"
      />
      <div className="flex items-center justify-between gap-2">
        <SeverityPill type={alert.type} />
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {COUNTRY_LABELS[alert.country]}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatAgo(alert.triggeredAt)}
          </span>
        </div>
      </div>
      <p className="mt-2.5 text-sm">{alert.message}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-muted-foreground">
          {alert.lotId ?? alert.warehouse ?? '—'}
        </span>
        <div className="relative z-10">
          <AcknowledgeButton
            id={alert.id}
            country={alert.country}
            acknowledged={alert.acknowledged}
          />
        </div>
      </div>
    </div>
  );
}
