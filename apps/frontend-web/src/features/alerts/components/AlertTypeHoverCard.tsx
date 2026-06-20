import { Link } from 'react-router';
import { Check } from 'lucide-react';
import type { Alert } from '@futurekawa/contracts';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { SeverityPill } from '@/features/alerts/components/SeverityPill';
import { alertSeverity } from '@/features/alerts/lib/severity';
import { formatAgo, formatTriggeredAt } from '@/features/alerts/lib/format';
import { COUNTRY_LABELS } from '@/features/dashboard/lib/country';

type AlertTypeHoverCardProps = Readonly<{
  alert: Alert;
}>;

// Cellule "Type" du tableau d'alertes : message tronqué cliquable (vers le
// détail) qui révèle au survol une carte détaillée (titre complet + métadonnées).
export function AlertTypeHoverCard({ alert }: AlertTypeHoverCardProps) {
  const { Icon } = alertSeverity(alert.type);

  const rows: ReadonlyArray<{ key: string; value: string; mono?: boolean }> = [
    { key: 'Lot', value: alert.lotId ?? '—', mono: true },
    { key: 'Pays', value: COUNTRY_LABELS[alert.country] },
    { key: 'Entrepôt', value: alert.warehouse ?? '—' },
    { key: 'Déclenchée', value: formatTriggeredAt(alert.triggeredAt) },
  ];

  return (
    <HoverCard openDelay={120} closeDelay={80}>
      <HoverCardTrigger asChild>
        <Link
          to={`/alerts/${alert.id}`}
          onClick={(event) => event.stopPropagation()}
          className="flex min-w-0 items-center gap-2 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate text-[13px]">{alert.message}</span>
        </Link>
      </HoverCardTrigger>

      <HoverCardContent align="start" className="overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-3">
          <SeverityPill type={alert.type} />
          {alert.acknowledged ? (
            <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-status-conforme">
              <Check className="size-3.5" aria-hidden />
              Acquittée
            </span>
          ) : (
            <span className="text-[11.5px] font-medium text-status-alerte">
              Non acquittée
            </span>
          )}
        </div>

        <div className="px-4 py-3">
          <p className="text-sm font-medium leading-snug text-pretty">
            {alert.message}
          </p>
          <dl className="mt-3 flex flex-col gap-1.5">
            {rows.map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-between gap-3"
              >
                <dt className="text-[12px] text-muted-foreground">{row.key}</dt>
                <dd
                  className={
                    row.mono
                      ? 'truncate font-mono text-[12.5px] font-medium tabular-nums'
                      : 'truncate text-[12.5px] font-medium'
                  }
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 border-t border-border pt-2 text-[11.5px] text-muted-foreground">
            {formatAgo(alert.triggeredAt)}
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
